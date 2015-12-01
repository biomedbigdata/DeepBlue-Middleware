var xmlrpc = require('xmlrpc');

var deepblue_cache = require('./cache');
var experiments_cache = require('./experiments_cache');
var settings = require('./settings');


var filter = function(row, columns, filters, global) {
  if (row == undefined) {
    console.log("row is undefined");
    return false;
  }

  // Discard the rows that does not match individual search
  for (var column in filters) {
    var column_name = columns[column];
    var filter_value = filters[column].toLowerCase().replace(/[\W_]+/g, "");
    if (row[column_name] == undefined) {
        console.log(row);
        console.log(columns);
        console.log(column);
        return false;
    }

    if ((column_name == "_id" ) || (column_name == "sample_id")) {
      var column_content = row[columns[column]].toLowerCase();
      if (column_content != filter_value) {
        return false;
      }
    } else {
      var column_content = row[columns[column]].toLowerCase().replace(/[\W_]+/g, "");
      if (column_content.indexOf(filter_value) < 0) {
        return false;
      }
    }
  }

  // Return true, because there is no more filters
  if (!global) {
    return true;
  }

  // Verify if at least one column matches with the global search
  for (column in columns) {
    var row_column_value = row[columns[column]];
    if (row_column_value == undefined) {
      console.log("undefined row column value");
      console.log(row);
      console.log(column);
      console.log(columns);
      return false;
    }
    if (row_column_value.toLowerCase().replace(/[\W_]+/g, "").indexOf(global) >= 0) {
      return true;
    }
  }

  // Return false because no one column matched with the global search
  return false;
}


var sort_data = function(data, pos, direction) {
  data.sort(function(a, b) {
    if (a[pos] === undefined || b[pos] == undefined) {
      console.log("a: ");
      console.log(a);
      console.log("b: ");
      console.log(b);
      console.log("pos: ");
      console.log(pos);
      return 0;
    }

    if (direction == "asc") {
      // TODO: optimize/cache the lower case.
      return a[pos].toLowerCase().localeCompare(b[pos].toLowerCase());
    } else {
      return b[pos].toLowerCase().localeCompare(a[pos].toLowerCase());
    }
  });

  return data;
}

var process = function(echo, collection, columns, start, length, global_search, sort_column, sort_direction, has_filter, columns_filters, key, res) {
  var cache;
  if (collection == "experiments") {
    cache = experiments_cache["cache"];
  } else {
    cache = deepblue_cache[collection];
  }

  cache.get(key, function(error, cache_data) {
    if (error) {
      return res.send(error);
    }
    var filtered = 0;
    var cache_data = sort_data(cache_data, columns[sort_column], sort_direction);

    var filtered_data = [];
    if (has_filter) {
      var pos = 0;
      while (pos < cache_data.length) {
        var row = cache_data[pos];
        if (filter(row, columns, columns_filters, global_search)) {
          filtered_data.push(row);
        } else {
          filtered++;
        }
        pos++;
      }
    } else {
      filtered_data = cache_data;
    }

    var i = start;
    var count = 0;
    var data = [];
    while ((i < filtered_data.length) && (count < length)) {
      var row = filtered_data[i];
      var dt_row = [];
      for (var column_pos in columns) {
        dt_row.push(row[columns[column_pos]]);
      }
      data.push(dt_row);
      count++;
      i++;
    }
    var result = {};
    result.sEcho = echo;
    result.iTotalRecords = cache_data.length;
    result.iTotalDisplayRecords = cache_data.length - filtered;
    result.data = data;
    res.send(result);
  });
}

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
      columns_filters[i] = columns_filter;
      has_filter = true;
    }
  }

  process(req.query.sEcho, collection, columns, start, length, global_search, sort_column, sort_direction, has_filter, columns_filters, key, res);
};


module.exports = datatable;
