'use strict';

/* global process */
var xmlrpc = require('xmlrpc');
var settings = require('./settings');
var users = require('./users.js')
var utils = require('./utils');

var xmlrpc_host = settings.xmlrpc_host();

var ExperimentsCacheControl = function() {
  console.log("Creating ExperimentsCacheControl");
  var self = this;
  self.collection_name = "experiments";

  self.projects_state = {};
  self.projects_data = {};
  self._project_counter = {};
  self._id_item = {};

  self.matches = 0;
  self.requests = 0;

  // TODO: Move to info.js and access the cache data from there
  self.get_info = function(error, user_key, user_info, params, callback) {
    console.log("experiments_cache.get_info");
    var id = params[0];
    if (error) {
      return callback(error);
    }
    if (id in self._id_item) {
      return callback(error, self._id_item[id]);
    }

    var client = xmlrpc.createClient(xmlrpc_host);
    client.methodCall('info', [id, user_key], function(error, infos) {
      if (error) {
        console.log("ERROR");
        console.log(error);
        return callback(error);
      }
      if (infos[0] == "error") {
        return callback({"error": infos[1]});
      }
      var infos_data = infos[1][0];
      var info = utils.build_info(infos_data)
      self._id_item[id] = info;
      return callback(error, self._id_item[id]);
    });
  }

  // TODO: Move to info.js and access the cache data from there
  self.info = function(id, user_key, callback)
  {
    console.log("experiments_cache.info()");
    users.check(user_key, callback, self.get_info, id);
  }

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

          client.methodCall("list_in_use", ["projects", user_key], function (error, value) {
            if (error) {
              return callback(error);
            }

            if (value[0] == "error") {
              return callback(value[1]);
            }

            var project_count = {};
            for (var k in value[1]) {
              var p_info = value[1][k];
              project_count[p_info[1]] = p_info[2];
            }

            for (var p in user_projects) {
              var project_name = user_projects[p]
              var project_state = self.projects_state[project_name]
              console.log(project_name + " - " + self._project_counter[project_name] + " - " + project_count[project_name]);
              if ( !(project_name in self._project_counter) || self._project_counter[project_name] != project_count[project_name]) {
                project_to_load.push(project_name);
                self._project_counter[project_name] = project_count[project_name];
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
                for (var up in user_projects) {
                  var project_name = user_projects[up];
                  if (self.projects_data[project_name] !== undefined) {
                    request_data = request_data.concat(self.projects_data[project_name]);
                  } else {
                    console.log(project_name + " data is undefined (probably it is loading)");
                  }
                }
                callback(error, request_data);
              });

              // 2. Some data is cached
              // 3. None data is cached
            } else {
              self.load_data(client, project_to_load, project_cached, user_key, counter, callback);
            }
          });
        }
      });
    },

    self.load_data = function(client, projects_to_load, projects_cached, user_key, counter, callback) {
      console.log("load new data for " + projects_to_load.length + " projects.");
      var parameters = ["", "", "", "", "", "", projects_to_load, user_key];
      client.methodCall("list_experiments", parameters, function(error, value) {
        if (error) {
          return callback(error);
        }

        if (value[0] == "error") {
          console.log(value[1]);
        }
        var ids = [];
        var list_ids = value[1];
        console.log("processings ids");
        for (var count in list_ids) {
          if (!(list_ids[count][0] in self._id_item)) {
            ids.push(list_ids[count][0]);
          }
        }

        console.log("request info");
        client.methodCall('info', [ids, user_key], function(error, infos) {

          if (error) {
            console.log(error);
            return callback(error);
          }

          var pre_cached_data = {}

          for (var p in projects_to_load) {
            var project_name = projects_to_load[p];
            console.log("init array for " + project_name);
            pre_cached_data[projects_to_load[p]] = [];
          }

          var infos_data = infos[1];
          for (var d in infos_data) {
            infos_data[d].extra_metadata = utils.experiments_extra_metadata(infos_data[d]);
            infos_data[d].biosource = infos_data[d].sample_info.biosource_name;
            self._id_item[infos_data[d]["_id"]] = infos_data[d];
          }

          for (var p in list_ids) {
            var item = self._id_item[list_ids[p][0]];
            pre_cached_data[item.project].push(item);
          }

          // set the data cache
          for (p in pre_cached_data) {
            console.log("storing: " + p + " " + counter + " " +   pre_cached_data[p].length);
            self.projects_state[p] = counter;
            self.projects_data[p] = pre_cached_data[p];
          }

          // Load the data from the cache
          var data = [];
          for (var cp in projects_to_load) {
            var cached_project_name = projects_to_load[cp];
            data = data.concat(self.projects_data[cached_project_name]);
          }

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
function callback_log(error, data) {
  if (error) {
      console.log(error);
  }
  if (data) {
    console.log(data.length);
  }
}

//experiments.get("anonymous_key", callback_log);

module.exports = {
  "cache": experiments,
};
