var express = require('express');
var xmlrpc = require('xmlrpc');

var settings = require('./settings');

var router = express.Router();

xmlrpc_host = settings.xmlrpc_host();

var client = xmlrpc.createClient(xmlrpc_host);

var Command = function(name, parameters) {
  var self = this;
  self.name = name;
  self.parameters = parameters;

  self.doRequest = function(req, res) {
    var xmlrpc_request_parameters = [];

    values = []
    if (req.method == "POST") {
      values = req.body;
    } else {
      values = req.query;
    }

    for (pos in self.parameters) {
      var parameter = self.parameters[pos];
      var parameter_name = parameter[0];
      var parameter_type = parameter[1];
      var multiple = parameter[2];
      if (parameter_name in values) {
        var raw_value = values[parameter_name];
        if (parameter_type == "string") {
          xmlrpc_request_parameters.push(raw_value);
        } else if (parameter_type == "int") {
          xmlrpc_request_parameters.push(parseInt(raw_value));
        } else if (parameter_type == "double") {
          xmlrpc_request_parameters.push(parseFloat(raw_value));
        } else if (parameter_type == "struct") {
          var extra_metadata = JSON.parse(raw_value);
          xmlrpc_request_parameters.push(extra_metadata);
        } else if (parameter_type == "boolean") {
          var bool_value = raw_value == "true";
          xmlrpc_request_parameters.push(bool_value);
        } else {
          res.send("Internal error: Unknown variables type " + parameter_type);
          return;
        }
      } else {
        if (parameter_name == "user_key") {
          xmlrpc_request_parameters.push("anonymous_key");
        } else {
          xmlrpc_request_parameters.push(null);
        }
      }
    }

    console.log(name, parameters, xmlrpc_request_parameters);

    client.methodCall(name, xmlrpc_request_parameters, function(error, value) {
      if (error) {
        console.log('error:', error);
        console.log('req headers:', error.req && error.req._header);
        console.log('res code:', error.res && error.res.statusCode);
        console.log('res body:', error.body);
      } else {
        res.send(value);
      }
    });
  }
}

client.methodCall('commands', [], function(error, value) {
  if (error) {
    console.log('error:', error);
    console.log('req headers:', error.req && error.req._header);
    console.log('res code:', error.res && error.res.statusCode);
    console.log('res body:', error.body);
  } else {
    if (value[0] == "error") {
      console.log(value[1]);
    }

    var commands = value[1];
    for (var command_name in commands) {
      var command = new Command(command_name, commands[command_name]["parameters"]);
      router.get("/" + command_name, command.doRequest);
      router.post("/" + command_name, command.doRequest);
    }
  }
});

module.exports = {
  router: router
}
