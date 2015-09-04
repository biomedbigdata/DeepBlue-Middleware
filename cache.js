/* global process */
var settings = require('./settings');
var utils = require('./utils');
var users = require('./users.js')
var xmlrpc = require('xmlrpc');

var xmlrpc_host = settings.xmlrpc_host();

var anonymous_key = "NA5HfJiaR2U7lopK"

var CacheControl = function(collection_name, parameters) {
  console.log("Creating cache controle for " + collection_name);
  var self = this;
  self.collection_name = collection_name;
  self.data = [];
  self._id_item = {};
  self.counter = -1;

  self.matches = 0;
  self.requests = 0;

  self.parameters = parameters;


  // TODO: Move to info.js and access the cache data from there
  self.get_info = function(error, user_key, user_info, callback) {
    if (error) {
      callback(error);
    }
    if (_id in self._id_item) {
      return callback(self._id_item[_id]);
    }
    else {
      var client = xmlrpc.createClient(xmlrpc_host);
      client.methodCall('info', [_id, user_key], function(error, infos) {
        if (error) {
          return callback(error);
        }
        if (infos[0] == "error") {
          return callback(infos[1]);
        }
        var infos_data = infos[1][0];
        info = utils.build_info(infos_data)
        self._id_item[_id] = info;
        return callback(error, self._id_item[_id]);
      });
    }
  }

  // TODO: Move to info.js and access the cache data from there
  self.info = function(_id, user_key, callback) {
    users.check(user_key, callback, self.get_info);
  }

  self.get = function(user_key, callback) {
      self.requests++;
      var client = xmlrpc.createClient(xmlrpc_host);
      client.methodCall('get_state', [collection_name, user_key], function(error, value) {
        if (error) {
          callback(error);
        } else {
          var counter = value[1];
          if (value[1] == self.counter) {
            self.matches++;
            process.nextTick(function() {
              callback(error, self.data);
            });
          } else {
            self.load_data(user_key, counter, callback);
          }
        }
      });
    },

    self.load_data = function(user_key, counter, callback) {
      var function_name = "list_" + self.collection_name;
      console.log("load new data");

      if (self.parameters) {
        function_parameters = self.parameters.concat([user_key]);
      } else {
        function_parameters = [user_key];
      }
      var client = xmlrpc.createClient(xmlrpc_host);
      client.methodCall(function_name, function_parameters, function(error, value) {

        if (error) {
          return callback(error);
        }

        if (value[0] == "error") {
          console.log(value[1]);
        }
        var ids = [];
        var list_ids = value[1];

        for (var count in list_ids) {
          if (!(list_ids[count][0] in self._id_item)) {
            ids.push(list_ids[count][0]);
          }
        }

        client.methodCall('info', [ids, user_key], function(error, infos) {
          if (error) {
            return callback(error);
          }
          var infos_data = infos[1];

          console.log("building json");
          for (var d in infos_data) {
            var _id = infos_data[d]["_id"];
            info = utils.build_info(infos_data[d]);
            self._id_item[_id] = infos_data[d];
          }

          var id_infos = [];
          for (var p in list_ids) {
            id_infos.push(self._id_item[list_ids[p][0]]);
          }

          self.counter = counter;
          self.data = id_infos;
          callback(error, self.data);
        });
      });
    };
};

var annotations = new CacheControl("annotations", [""]);
var biosources = new CacheControl("biosources", [null]);
var epigenetic_marks = new CacheControl("epigenetic_marks");
var column_types = new CacheControl("column_types");
var experiments = new CacheControl("experiments", ["", "", "", "", ""]);
var genomes = new CacheControl("genomes");
var projects = new CacheControl("projects");
var samples = new CacheControl("samples", ["", null]);
var techniques = new CacheControl("techniques");

function callback_log(error, data) {
  if (error) {
      console.log(error);
  }
  if (data) {
    console.log(data.length);
  }
}

/*
annotations.get(anonymous_key, callback_log);
biosources.get(anonymous_key, callback_log);
epigenetic_marks.get(anonymous_key, callback_log);
column_types.get(anonymous_key, callback_log);
experiments.get(anonymous_key, callback_log);
genomes.get(anonymous_key, callback_log);
projects.get(anonymous_key, callback_log);
samples.get(anonymous_key, callback_log);
techniques.get(anonymous_key, callback_log);
*/

module.exports = {
  "epigenetic_marks": epigenetic_marks,
  "biosources": biosources,
  "annotations": annotations,
  "column_types": column_types,
  "genomes": genomes,
  "projects": projects,
  "samples": samples,
  "techniques": techniques
};