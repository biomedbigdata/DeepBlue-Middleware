/* global process */
var xmlrpc = require('xmlrpc');
var settings = require('./settings');
var utils = require('./utils');

var xmlrpc_host = settings.xmlrpc_host();

var CacheControl = function(collection_name, parameters) {
  console.log("Creating cache controle for " + collection_name);
  var self = this;
  self.collection_name = collection_name;
  self.data = [];
  self.counter = -1;

  self.matches = 0;
  self.requests = 0;

  self.parameters = parameters;

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
          callback(error);
        }

        if (value[0] == "error") {
          console.log(value[1]);
        }
        var ids = [];
        var data = value[1];
        console.log("processings ids");
        for (var count in data) {
          ids.push(data[count][0]);
        }

        console.log("request info");
        client.methodCall('info', [ids, user_key], function(error, infos) {
          console.log(infos);
          console.log(error);
          if (error) {
            callback(error);
          }

          var infos_data = infos[1];

          console.log("building json");
          for (var d in infos_data) {
            if (infos_data[d].type == "experiment") {
              infos_data[d].extra_metadata = utils.experiments_extra_metadata(infos_data[d]);
              infos_data[d].biosource = infos_data[d].sample_info.biosource_name;
            }

            if (infos_data[d].type == "annotation") {
              infos_data[d].extra_metadata = utils.annotations_extra_metadata(infos_data[d]);
            }

            if (infos_data[d].type == "biosource") {
              infos_data[d].extra_metadata = utils.biosources_extra_metadata(infos_data[d]);
            }

            if (infos_data[d].type == "sample") {
              infos_data[d].extra_metadata = utils.samples_extra_metadata(infos_data[d]);
            }

            if (infos_data[d].type == "column_type") {
              infos_data[d].info = utils.column_type_info(infos_data[d]);
            }
          }

          self.data = infos[1];
          self.counter = counter;
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

module.exports = {
  "epigenetic_marks": epigenetic_marks,
  "biosources": biosources,
  "annotations": annotations,
  "column_types": column_types,
  "experiments": experiments,
  "genomes": genomes,
  "projects": projects,
  "samples": samples,
  "techniques": techniques
};