var xmlrpc = require('xmlrpc');

var deepblue_cache = require('./cache');
var settings = require('./settings');

var filter = function(row, columns, filters, global) {
  // Discard the rows that does not match individual search
  for (column in filters) {
    individual_filter = true;
    var filter_value = filters[column];
    var column_content = row[columns[column]].toLowerCase();

    if (column_content.indexOf(filter_value) == -1) {
      return false;
    }
  }

  // Return true, because there is no more filters
  if (!global) {
    return true;
  }

  // Verify if at least one column matches with the global search
  for (column in columns) {
    if (row[columns[column]].toLowerCase().indexOf(global) > -1) {
      return true;
    }
  }

  // Return false because no one column matched with the global search
  return false;
}


var sort_data = function(data, pos, direction) {
  console.log(data);
  data.sort(function(a, b) {
    if (direction == "asc") {
      return b[pos].localeCompare(a[pos]);
    } else {
      return a[pos].localeCompare(b[pos]);
    }
  });

  return data;
}


var get_data = function(echo, collection, columns, start, length, global_search, sort_column, sort_direction, has_filter, columns_filters, res) {
  console.log("get_data");

  var data = [];

  var client = xmlrpc.createClient(xmlrpc_host);
  client.methodCall('list_epigenetic_marks', ['mk8xHba3tqpeRPy4'], function(error, value) {
    var ems = [];
    for (count in value[1]) {
      ems.push(value[1][count][0]);
    }

    client.methodCall('info', [ems, 'mk8xHba3tqpeRPy4'], function(error, value) {
      var filtered = 0;
      var count = 0;
      var i = start;

      while (i < value[1].length) {
        var row = value[1][i];

        i++;

        if (has_filter && !filter(row, columns, columns_filters, global_search)) {
          filtered++;
          continue;
        }

        if (count < length) {
          var dt_row = [];
          for (column_pos in columns) {
            dt_row.push(row[columns[column_pos]]);
          }

          count++;
          data.push(dt_row);
        }
      }
      data = sort_data(data, sort_column, sort_direction);
      result = {};
      result.sEcho = echo;
      result.iTotalRecords = value[1].length;
      result.iTotalDisplayRecords = value[1].length - filtered;
      result.data = data;
      res.send(result);
    });
  });
}

// TODO: datatables :)
var datatable = function(req, res) {
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
      columns_filters[i] = columns_filter;
      has_filter = true;
    }
  }
  console.log(columns);

  get_data(req.query.sEcho, collection, columns, start, length, global_search, sort_column, sort_direction, has_filter, columns_filters, res);
};


module.exports = datatable;