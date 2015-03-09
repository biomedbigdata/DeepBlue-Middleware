var express = require('express');
var path = require('path');
var logger = require('morgan');
var bodyParser = require('body-parser');
var xmlrpc         = require('xmlrpc');
var session = require('express-session')

var app = express();

app.use(session({
  resave: false,
  saveUninitialized: true,
  secret: 'epiexplorer is cool'
}))

var datasets = {};

var router = express.Router();

//xmlrpc_host = { host: 'deepblue.mpi-inf.mpg.de', port: 80, path: '/xmlrpc'};
xmlrpc_host = { host: '127.0.0.1', port: 31415, path: '/'};
var client = xmlrpc.createClient(xmlrpc_host);

var Command = function (name, parameters) {
  var self = this;
  self.name = name;
  self.parameters = parameters;

  self.doRequest = function (req, res) {
    console.log(self);
    console.log("executing : " + name + " " + parameters);
    console.log(req.query);

    var xmlrpc_request_parameters = [];

    for (pos in self.parameters) {
      var parameter = self.parameters[pos];
      var parameter_name = parameter[0];
      var parameter_type = parameter[1];
      var multiple = parameter[2];
      console.log(req.query);
      if (parameter_name in req.query) {
        console.log("param:");
        console.log(req.query[parameter_name]);
        xmlrpc_request_parameters.push(req.query[parameter_name]);
      } else {
        xmlrpc_request_parameters.push("");
      }
    }
    console.log(xmlrpc_request_parameters);

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


client.methodCall('commands', [], function (error, value) {
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
      router.get("/"+command_name, command.doRequest);
    }
  }
});


var status = function (req, res) {
  var client = xmlrpc.createClient(xmlrpc_host);
  client.methodCall('getStatus', [], function (error, value) {
    if (error) {
      console.log('error:', error);
      console.log('req headers:', error.req && error.req._header);
      console.log('res code:', error.res && error.res.statusCode);
      console.log('res body:', error.body);
    } else {
      res.send(value);
    }
  })
}


router.get('/status', status);

app.use('/api', router);

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});


module.exports = app;
