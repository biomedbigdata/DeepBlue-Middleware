var xmlrpc = require('xmlrpc');
var settings = require('./settings');
var utils = require('./utils');

var xmlrpc_host = settings.xmlrpc_host();

CacheControl = function(collection_name, parameters) {
  console.log("Creating cache controle for " + collection_name);
  var self = this;
  self.collection_name = collection_name;
  self.data = [];
  self.counter = -1;

  self.matches = 0;
  self.requests = 0;

  if (parameters) {
    self.parameters = parameters.concat(['mk8xHba3tqpeRPy4']);
  } else {
    self.parameters = ['mk8xHba3tqpeRPy4'];
  }


  self.get = function(callback) {
      self.requests++;
      var client = xmlrpc.createClient(xmlrpc_host);
      client.methodCall('get_state', [collection_name, "mk8xHba3tqpeRPy4"], function(error, value) {
        if (error) {
          callback(error);
        } else {
          var counter = value[1];
          if (value[1] == self.counter) {
            self.matches++;
            process.nextTick(function() {
              callback(error, self.data)
            });
          } else {
            self.load_data(counter, callback);
          }
        }
      });
    },

    self.load_data = function(counter, callback) {
      var function_name = "list_" + self.collection_name;
      console.log("load new data");

      var client = xmlrpc.createClient(xmlrpc_host);
      client.methodCall(function_name, self.parameters, function(error, value) {

        if (error) {
          callback(error);
        }

        if (value[0] == "error") {
          console.log(value[1]);
        }

        var ids = [];
        var data = value[1];

        for (count in data) {
          ids.push(data[count][0]);
        }

        client.methodCall('info', [ids, 'mk8xHba3tqpeRPy4'], function(error, infos) {
          if (error) {
            callback(error);
          }

          var infos_data = infos[1];

          for (d in infos_data) {
            if (infos_data[d].type == "experiment" || infos_data[d].type == "experiment" || infos_data[d].type == "annotation") {
              infos_data[d].extra_metadata = utils.experiment_annotation_extra_metadata(infos_data[d]);
              infos_data[d].biosource = infos_data[d].sample_info.biosource_name;
            }

            if (infos_data[d].type == "biosource" || infos_data[d].type == "sample") {
              infos_data[d].extra_metadata = utils.biosources_extra_metadata(infos_data[d]);
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
    }
}

annotations = new CacheControl("annotations", [""]);
biosources = new CacheControl("biosources");
epigenetic_marks = new CacheControl("epigenetic_marks");
column_types = new CacheControl("column_types");
experiments = new CacheControl("experiments", ["", "", "", "", ""]);
genomes = new CacheControl("genomes");
projects = new CacheControl("projects");
samples = new CacheControl("samples", ["", null]);
techniques = new CacheControl("techniques");

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
}