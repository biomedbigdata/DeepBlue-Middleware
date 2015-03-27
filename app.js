var express = require('express');
var path = require('path');
var logger = require('morgan');
var bodyParser = require('body-parser');
var xmlrpc = require('xmlrpc');
var session = require('express-session')

var app = express();

app.use(session({
  resave: false,
  saveUninitialized: true,
  secret: 'epiexplorer is cool'
}))

var datasets = {};

var router = express.Router();

xmlrpc_host = {
  host: 'deepblue.mpi-inf.mpg.de',
  port: 80,
  path: '/xmlrpc'
};
//xmlrpc_host = { host: '127.0.0.1', port: 31415, path: '/'};
var client = xmlrpc.createClient(xmlrpc_host);

var Command = function(name, parameters) {
  var self = this;
  self.name = name;
  self.parameters = parameters;

  self.convert = function(value, type) {
    if (type == "string") {
      return valeue;
    }
  }

  self.doRequest = function(req, res) {
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
      console.log("param: " + req.query[parameter_name] + " type " + parameter_type);
      if (parameter_name in req.query) {
        var raw_value = req.query[parameter_name];
        if (parameter_type == "string") {
          xmlrpc_request_parameters.push(raw_value);
        } else if (parameter_type == "int") {
          xmlrpc_request_parameters.push(parseInt(raw_value));
        } else if (parameter_type == "double") {
          xmlrpc_request_parameters.push(parseFloat(raw_value));
        } else {
          res.send("Internal error: Unknown variables type " + parameter_type);
          return;
        }
      } else {
        xmlrpc_request_parameters.push(null);
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
    }
  }
});


var status = function(req, res) {
  var client = xmlrpc.createClient(xmlrpc_host);
  client.methodCall('getStatus', [], function(error, value) {
    if (error) {
      console.log('error:', error);
      console.log('req headers:', error.req && error.req._header);
      console.log('res code:', error.res && error.res.statusCode);
      console.log('res body:', error.body);
    } else {
      res.send(value);
    }
  })
};

/*** ****/

var get_data = function(echo, collection, columns, start, length, global_search, sort_column, sort_direction, res) {
  console.log("get_data");

  var data = [];

  var client = xmlrpc.createClient(xmlrpc_host);
  client.methodCall('list_epigenetic_marks', ['mk8xHba3tqpeRPy4'], function(error, value) {
    console.log(error);
    console.log(value[1]);

    var ems = [];
    for (count in value[1]) {
      ems.push(value[1][count][0]);
    }

    client.methodCall('info', [ems, 'mk8xHba3tqpeRPy4'], function(error, value) {
      console.log(value);

      for (count in value[1]) {
        var dt_row = [];
        var row = value[1][count];

        for (column_pos in columns ) {
          dt_row.push(row[columns[column_pos]]);
        }

        data.push(dt_row);
      }


      console.log(value[1].length);

      result = {};
      result.sEcho = echo;
      result.iTotalRecords = value[1].length;
      result.iTotalDisplayRecords = value[1].length;
      result.data = data;
      res.send(result);

    });

  });


  return {
    data: data
  };
}



/***  ****/


// TODO: datatables :)
var datatable = function(req, res) {
  console.log("Datatable");
  console.log(req.query);

  var collection = req.query.collection;

  var columns = [];
  var columns_count = parseInt(req.query.iColumns);
  for (var i = 0; i < columns_count; i++) {
    var param_name = "col_" + i.toString();
    var column_name = req.query[param_name];
    columns.push(column_name);
  }
  console.log(columns);

  var start = parseInt(req.query.iDisplayStart);
  console.log(start);
  var length = parseInt(req.query.iDisplayLength);
  console.log(length);

  console.log("global_search");
  var global_search = req.query.sSearch;
  console.log(global_search);

  console.log("sort_column");
  var sort_column = req.query.iSortCol_0;
  console.log(sort_column);

  console.log("sort_direction");
  var sort_direction = req.query.sSortDir_0;
  console.log(sort_direction);

  var result = get_data(req.query.sEcho, collection, columns, start, length, global_search, sort_column, sort_direction, res);
};

router.get('/status', status);
router.post('/datatable', datatable);
router.get('/datatable', datatable);

app.use('/', router);

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: false
}));
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