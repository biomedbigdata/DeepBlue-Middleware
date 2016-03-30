var xmlrpc = require('xmlrpc');

var deepblue_cache = require('./cache');
var experiments_cache = require('./experiments_cache');
var settings = require('./settings');

var client = xmlrpc.createClient(settings.xmlrpc_host());

var datatable = function(req, res) {
  console.log(req.query);

  var collection = req.query.collection;
  var key = req.query.key;

  console.log(key);

  var columns = [];
  var columns_count = parseInt(req.query.iColumns);

  console.log(columns_count);


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

  var has_filter = false;
  console.log("global_search");
  var global_search = req.query.sSearch.toLowerCase();
  console.log(global_search);
  if (global_search) {
    console.log("has filter");
    has_filter = true;
  }

  console.log("sort_column");
  var sort_column = req.query.iSortCol_0;
  console.log(sort_column);

  console.log("sort_direction");
  var sort_direction = req.query.sSortDir_0;
  console.log(sort_direction);

  var columns_filters = {};
  var columns_count = parseInt(req.query.iColumns);
  for (var i = 0; i < columns_count; i++) {
    var param_name = "sSearch_" + i.toString();
    var columns_filter = req.query[param_name].toLowerCase();
    if (columns_filter) {
      columns_filters[columns[i]] = columns_filter;
      has_filter = true;
    }
  }

  var sort_column_name = columns[parseInt(sort_column)];

  console.log("columns_filters");
  console.log(columns_filters);


  client.methodCall("datatable", [collection, columns, start, length, global_search, sort_column_name, sort_direction, has_filter, columns_filters, key], function(error, value) {
      if (error) {
        console.log('error:', error);
        console.log('req headers:', error.req && error.req._header);
        console.log('res code:', error.res && error.res.statusCode);
        console.log('res body:', error.body);
        res.send(error);
      } else {
        var result = {};
        result.sEcho = req.query.sEcho;
        result.iTotalDisplayRecords = value[1][0];
        result.iTotalRecords = value[1][1].length;
        result.data = value[1][1];
        res.send(result);
      }
    });
};


module.exports = datatable;
