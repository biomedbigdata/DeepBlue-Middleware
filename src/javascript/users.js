'use strict';

var Q = require('q');
var settings = require('./settings');
var xmlrpc = require('xmlrpc');
var xmlrpc_host = settings.xmlrpc_host();


var last_check = Date.now();
var users_info_cache = {};

var check = function (user_key) {
  var deferred = Q.defer();
  var client = xmlrpc.createClient(xmlrpc_host);

  // clear the users cache ever minute
  if (Date.now() > last_check + 60000) {
    users_info_cache = {};
    last_check = Date.now()
  }

  if (user_key in users_info_cache) {
    deferred.resolve(users_info_cache[user_key]);
  } else {
    client.methodCall('info', ["me", user_key], function(error, infos) {
      if (error) {
        deferred.reject(error);
        return;
      }

      if (infos[0] == "error") {
        deferred.reject(infos[1]);
        return;
      }

      var user_info = infos[1][0];

      if (user_info["permission_level"] == "NONE") {
        deferred.reject({"error":"Invalid permission level."});
        return;
      }

      users_info_cache[user_key] = user_info;
      deferred.resolve(user_info);
    });
  }
  return deferred.promise;
}


module.exports = {
  "check" : check
}

