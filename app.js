var express = require('express');
var path = require('path');
var logger = require('morgan');
var bodyParser = require('body-parser');

var datatable = require('./datatable');
var rest_to_xmlrpc = require('./rest_to_xmlrpc');
var settings = require('./settings');
var info = require('./info');

var app = express();

var router = rest_to_xmlrpc.router;

router.post('/datatable', datatable);
router.get('/datatable', datatable);
console.log(info);
router.get('/cached_info', info);

app.use('/', router);

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
    res.status(err.status || 500).send({
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500).send({
    message: err.message,
    error: err
  });
});


module.exports = app;