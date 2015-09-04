var settings = require('./settings');
var xmlrpc = require('xmlrpc');
var xmlrpc_host = settings.xmlrpc_host();

check = function (user_key, sender, callback) {
	var client = xmlrpc.createClient(xmlrpc_host);
	client.methodCall('info', ["me", user_key], function(error, infos) {
		if (error) {
			return sender(error);
		}

		if (infos[0] == "error") {
			return sender(infos[1]);
		}

		var user_info = infos[0][1];

		if (user_info["permission_level"] == "NONE") {
			return sender({"error":"Invalid permission level level"});
		}

		callback(error, user_key, user_info, sender);
	});
}


module.exports = {
	"check" : check
}

