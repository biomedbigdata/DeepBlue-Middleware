var xmlrpc = require('xmlrpc');
var settings = require('./settings');

var xmlrpc_host = settings.xmlrpc_host();

CacheControl = function(collection_name) {
  console.log("Creating cache controle for " + collection_name);
  var self = this;
  self.collection_name = collection_name;
  self.data = [];
  self.counter = -1;

  self.matches = 0;
  self.requests = 0;

  self.get = function(callback) {
      self.requests++;
      var client = xmlrpc.createClient(xmlrpc_host);
      client.methodCall('get_state', [collection_name, "mk8xHba3tqpeRPy4"], function(error, value) {
        console.log(callback);
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
      client.methodCall(function_name, ['mk8xHba3tqpeRPy4'], function(error, value) {
        self.data = value;
        self.counter = counter;
        callback(error, self.data);
      });
    }
}

epigenetic_marks = new CacheControl("epigenetic_marks");
biosources = new CacheControl("biosources");
annotations = new CacheControl("annotations");
column_types = new CacheControl("column_types");
experiments = new CacheControl("experiments");
genomes = new CacheControl("genomes");
projects = new CacheControl("projects");
samples = new CacheControl("samples");
techniques = new CacheControl("techniques");

exports.caches = {
  epigenetic_marks: epigenetic_marks,
  biosources: biosources,
  annotations: annotations,
  column_types: column_types,
  experiments: experiments,
  genomes: genomes,
  projects: projects,
  samples: samples,
  techniques: techniques
}