var annotations_extra_metadata = function(row) {
  var tmp_str = "";

  if (row.format) {
    tmp_str += "<b>Format</b>: " + row.format + "<br />";
    tmp_str += "<br />";
  }

  if (row.sample_info) {
    tmp_str += "<b>Sample Info</b> <br />";
    for (extra_metadata_key in row.sample_info) {
      var extra_metadata_value = row.sample_info[extra_metadata_key];
      if ((extra_metadata_value != '') && (extra_metadata_value != '-')) {
        if (extra_metadata_key == 'key') {
          tmp_str += "<b>" + extra_metadata_key + "</b> : <a href='" + extra_metadata_value + "' target='_blank'\>" + extra_metadata_value + '</a><br />';
        } else {
          tmp_str += '<b>' + extra_metadata_key + '</b> : ' + extra_metadata_value + "<br />";
        }
      }
    }
  }

  tmp_str += "<br />";

  if (row.extra_metadata) {
    tmp_str += "<b>Extra Metadata</b> <br />";
    for (extra_metadata_key in row.extra_metadata) {
      var extra_metadata_value = row.extra_metadata[extra_metadata_key];
      if ((extra_metadata_value != '') && (extra_metadata_value != '-')) {
        if (extra_metadata_key == 'key') {
          tmp_str += "<b>" + extra_metadata_key + "</b> : <a href='" + extra_metadata_value + "' target='_blank'\>" + extra_metadata_value + '</a><br />';
        } else {
          tmp_str += '<b>' + extra_metadata_key + '</b> : ' + extra_metadata_value + "<br />";
        }
      }
    }
  }

  return tmp_str;
}

var experiments_extra_metadata = function(row) {
  var tmp_str = annotations_extra_metadata(row);

  return "<div class='exp-metadata'>" + tmp_str + "</div><div class='exp-metadata-more-view'>-- View metadata --</div>";
}

var biosources_extra_metadata = function(row) {
  var tmp_str = "";
  for (key in row.extra_metadata) {
    if (key != "type" && key != "_id" && key != "biosource_name" && key != "user") {
      if (row.extra_metadata[key]) {
        tmp_str += "<b>" + key + "</b> : " + row.extra_metadata[key] + "</br>";
      }
    }
  }
  return tmp_str;
}

var samples_extra_metadata = function(row) {
  var tmp_str = "";
  for (key in row) {
    if (key != "type" && key != "_id" && key != "biosource_name" && key != "user") {
      tmp_str += "<b>" + key + "</b> : " + row[key] + "</br>";
    }
  }
  return tmp_str;
}

var column_type_info = function(row) {
  if (row.column_type == "category") {
    return "Acceptable Items: " + row.items;
  } else if (row.column_type == "range") {
    return row.minimum + " - " + row.maximum;
  } else if (row.column_type == "calculated") {
    return row.code;
  } else {
    return "";
  }
}

module.exports = {
  annotations_extra_metadata: annotations_extra_metadata,
  experiments_extra_metadata: experiments_extra_metadata,
  biosources_extra_metadata: biosources_extra_metadata,
  samples_extra_metadata: samples_extra_metadata,
  column_type_info: column_type_info
}