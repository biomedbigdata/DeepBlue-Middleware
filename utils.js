var process_extra_metadata = function(row) {
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

  return "<div class='exp-metadata'>" + tmp_str + "</div><div class='exp-metadata-more-view'>-- View metadata --</div>";
}


module.exports = {
  process_extra_metadata : process_extra_metadata
}