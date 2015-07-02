/* global process */
var xmlrpc = require('xmlrpc');
var settings = require('./settings');
var utils = require('./utils');

var xmlrpc_host = settings.xmlrpc_host();

var ExperimentsCacheControl = function() {
  console.log("Creating ExperimentsCacheControl");
  var self = this;
  self.collection_name = "experiments";

  self.projects_state = {};
  self.projects_data = {};

  self.matches = 0;
  self.requests = 0;

  self.get = function(user_key, callback) {
      self.requests++;
      var client = xmlrpc.createClient(xmlrpc_host);

      var user_projects = [];
      client.methodCall("list_projects", [user_key], function(error, value) {
        if (error) {
          callback(error);
        } else {
          var projects = value[1];
          for (var project in projects) {
            user_projects.push(projects[project][1]);
          }
          self.check_status(client, user_key, user_projects, callback);
        }
      });
    },

    self.check_status = function(client, user_key, user_projects, callback) {
      client.methodCall('get_state', [self.collection_name, user_key], function(error, value) {
        if (error) {
          callback(error);
        } else {
          var counter = value[1];
          var project_to_load = [];
          var project_cached = [];

          for (p in user_projects) {
            var project_name = user_projects[p]
            var project_state = self.projects_state[project_name]
            console.log(project_name + " - " + project_state);
            if (project_state == undefined || project_state != counter) {
              project_to_load.push(project_name);
            } else {
              project_cached.push(project_name);
            }
          }

          // Three Options
          // 1. All data is cached
          if (project_to_load.length == 0) {
            var request_data = [];
            self.matches++;
            console.log("Everything is cached <3.");
            process.nextTick(function() {
              for (up in user_projects) {
                var project_name = user_projects[up];
                request_data = request_data.concat(self.projects_data[project_name]);
              }
              callback(error, request_data);
            });

            // 2. Some data is cached
            // 3. None data is cached
          } else {
            self.load_data(client, project_to_load, project_cached, user_key, counter, callback);
          }
        }
      });
    },

    self.load_data = function(client, projects, projects_cached, user_key, counter, callback) {
      console.log("load new data for " + projects.length + " projects.");
      var parameters = ["", "", "", "", projects, user_key];
      client.methodCall("list_experiments", parameters, function(error, value) {
        if (error) {
          callback(error);
        }

        if (value[0] == "error") {
          console.log(value[1]);
        }
        var ids = [];
        var info_data = value[1];
        console.log("processings ids");
        for (var count in info_data) {
          ids.push(info_data[count][0]);
        }

        console.log("request info");
        client.methodCall('info', [ids, user_key], function(error, infos) {
          data = [];
          pre_cached_data = {};

          if (error) {
            console.log(error);
            callback(error);
          }

          for (p in projects) {
            var project_name = projects[p];
            console.log("init array for " + project_name);
            pre_cached_data[projects[p]] = [];
          }

          var infos_data = infos[1];
          for (var d in infos_data) {
            infos_data[d].extra_metadata = utils.experiments_extra_metadata(infos_data[d]);
            infos_data[d].biosource = infos_data[d].sample_info.biosource_name;
            pre_cached_data[infos_data[d].project].push(infos_data[d]);
            data.push(infos_data[d]);
          }

          // set the data cache
          for (p in pre_cached_data) {
            console.log("storing: " + p + " " + counter + " " +   pre_cached_data[p].length);
            self.projects_state[p] = counter;
            self.projects_data[p] = pre_cached_data[p];
          }

          // Load the data from the cache
          for (cp in projects_cached) {
            var cached_project_name = projects_cached[cp];
            data = data.concat(self.projects_data[cached_project_name]);
          }

          callback(error, data);
        });
      });
    };
};

var experiments = new ExperimentsCacheControl();

module.exports = {
  "cache": experiments,
};