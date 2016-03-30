var xmlrpc = require('xmlrpc');

var settings = require('./settings');

var client = xmlrpc.createClient(settings.xmlrpc_host());

var datatable = function(req, res) {
  var collection = req.query.collection;
  var key = req.query.key;
  var columns = [];
  var columns_count = parseInt(req.query.iColumns);

  for (var i = 0; i < columns_count; i++) {
    var param_name = "col_" + i.toString();
    var column_name = req.query[param_name];
    columns.push(column_name);
  }

  var start = parseInt(req.query.iDisplayStart);
  var length = parseInt(req.query.iDisplayLength);

  var has_filter = false;
  var global_search = req.query.sSearch.toLowerCase();
  if (global_search) {
    has_filter = true;
  }

  var sort_column = req.query.iSortCol_0;
  var sort_direction = req.query.sSortDir_0;
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
      result.iTotalDisplayRecords = value[1][0]; //cache_data.length; // - filtered;
      result.iTotalRecords = value[1][1].length;
      result.data = value[1][1];
      res.send(result);
    }
  });
};

module.exports = datatable;
