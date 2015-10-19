var settings = require('./settings');
var xmlrpc = require('xmlrpc');
var xmlrpc_host = settings.xmlrpc_host();


var last_check = Date.now();
var users_info_cache = {};

check = function (user_key, sender, callback, param) {
	console.log("users.check");
	var client = xmlrpc.createClient(xmlrpc_host);

	// clear the users cache ever minute
	if (Date.now() > last_check + 60000) {
		console.log("Clearning users info cache");
		users_info_cache = {};
		last_check = Date.now()
	}

	if (user_key in users_info_cache) {
		return callback(null, user_key, users_info_cache[user_key], [param], sender);
	}

	client.methodCall('info', ["me", user_key], function(error, infos) {
		if (error) {
			return sender(error);
		}

		if (infos[0] == "error") {
			return sender(infos[1]);
		}

		var user_info = infos[1][0];

		if (user_info["permission_level"] == "NONE") {
			return sender({"error":"Invalid permission level level"});
		}

		users_info_cache[user_key] = user_info;
		callback(error, user_key, user_info, [param], sender);
	});
}


module.exports = {
	"check" : check
}

