
var deepblue_cache = require('./cache');
var experiments_cache = require('./experiments_cache');

info = function(req, res) {


	callback = function (error, data) {
		if (error) {
			res.send(error);
		} else {
			res.send(data);
		}
	}

	_id = req.query._id;
	user_key = req.query.user_key

	if (_id == undefined) {
		return callback({"error":"_id not defined"});
	}

	if (user_key == undefined) {
		return callback({"error":"user_key not defined"});
	}

	if (_id.substring(0, 1) == "a") {
		deepblue_cache["annotations"].info(_id, user_key, callback);
	}

    else if (_id.substring(0, 1) ==  "g") {
    	deepblue_cache["genomes"].info(_id, user_key, callback);
	}

    else if (_id.substring(0, 2) ==  "bs") {
    	deepblue_cache["biosources"].info(_id, user_key, callback);
    }

    else if (_id.substring(0, 1) ==  "s") {
    	deepblue_cache["samples"].info(_id, user_key, callback);
    }

    else if (_id.substring(0, 2) ==  "em") {
    	deepblue_cache["epigenetic_marks"].info(_id, user_key, callback);
    }

    else if (_id.substring(0, 1) ==  "e") {
    	experiments_cache["cache"].info(_id, user_key, callback);
    }

    else if (_id.substring(0, 1) ==  "t") {
    	deepblue_cache["techniques"].info(_id, user_key, callback);
    }

    else {
    	callback({"error":"invalid _id:"+_id});
    }
}

module.exports = info;
