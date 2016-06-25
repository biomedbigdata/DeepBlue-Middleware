var normalized_names = {};
normalized_names["DNA Methylation"] = "dnamethylation";
normalized_names["dna methylation"] = "dnamethylation";

var unnormalized_names = {};
unnormalized_names["dnamethylation"] = "DNA Methylation";

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
    for (var extra_metadata_key in row.extra_metadata) {
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
};

var experiments_extra_metadata = function(row) {
  var tmp_str = annotations_extra_metadata(row);

  return "<div class='exp-metadata'>" + tmp_str + "</div><div class='exp-metadata-more-view'>-- View metadata --</div>";
}

var epigenetic_marks_extra_metadata = function(row) {
  var tmp_str = "";
  if (row.extra_metadata) {
    for (var key in row.extra_metadata) {
      if (key != "type" && key != "_id") {
        if (row.extra_metadata[key]) {
          tmp_str += "<b>" + key + "</b> : " + row.extra_metadata[key] + "</br>";
        }
      }
    }
  }
  return tmp_str;
};

var biosources_extra_metadata = function(row) {
  var tmp_str = "";
  for (var key in row.extra_metadata) {
    if (key != "type" && key != "_id" && key != "biosource_name" && key != "user") {
      if (row.extra_metadata[key]) {
        tmp_str += "<b>" + key + "</b> : " + row.extra_metadata[key] + "</br>";
      }
    }
  }
  return tmp_str;
};

var samples_extra_metadata = function(row) {
  var tmp_str = "";
  for (var key in row) {
    if (key != "type" && key != "_id" && key != "biosource_name" && key != "user") {
      tmp_str += "<b>" + key + "</b> : " + row[key] + "</br>";
    }
  }
  return tmp_str;
};

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
};


var build_info = function (info_data) {
  if (info_data.type == "experiment") {
    info_data.extra_metadata = experiments_extra_metadata(info_data);
    info_data.biosource = info_data.sample_info.biosource_name;
  }

  if (info_data.type == "annotation") {
    info_data.extra_metadata = annotations_extra_metadata(info_data);
  }

  if (info_data.type == "biosource") {
    info_data.extra_metadata = biosources_extra_metadata(info_data);
  }

  if (info_data.type == "epigenetic_mark") {
   info_data.extra_metadata = epigenetic_marks_extra_metadata(info_data);
  }

  if (info_data.type == "sample") {
    info_data.extra_metadata = samples_extra_metadata(info_data);
  }

  if (info_data.type == "column_type") {
    info_data.info = column_type_info(info_data);
  }
  return info_data;
};

var get_normalized_array = function (name_array) {
  var normalized_array = [];
  for (var n in name_array) {
    normalized_array.push(get_normalized(name_array[n]));
  }
  return normalized_array;
};

var get_normalized = function(name) {
  if (name in normalized_names) {
    return normalized_names[name];
  } else { 
    var norm_name = name.toLowerCase().replace(/[\W_]+/g, "");
    normalized_names[name] = norm_name;
    // TODO: do not overwrite the existing unnormalized names.
    unnormalized_names[norm_name] = name;
    return norm_name;
  }
};

var get_unnormalized = function(normalized_name) {
  if (normalized_name in unnormalized_names) {
    return unnormalized_names[normalized_name];
  } else {
    // It can NEVER happens.
    console.log(normalized_name + " NOT FOUND!");
    return "XXX";
  }
};

module.exports = {
  annotations_extra_metadata: annotations_extra_metadata,
  experiments_extra_metadata: experiments_extra_metadata,
  biosources_extra_metadata: biosources_extra_metadata,
  samples_extra_metadata: samples_extra_metadata,
  column_type_info: column_type_info,
  build_info: build_info,
  get_normalized: get_normalized,
  get_unnormalized: get_unnormalized,
  get_normalized_array: get_normalized_array
};