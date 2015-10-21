'use strict';

var deepblue_cache = require('./cache');
var experiments_cache = require('./experiments_cache');


var WaitingQueue = function(count, res) {
    var self = this;
    self.count = count;
    self.res = res;
    self.data = [];
    self.had_error = false;

    self.insert = function(error, value) {
        if (error) {
            console.log("error on insert");
            self.error(error);
        }

        if (self.had_error) {
            return;
        }

        self.data.push(value);
        if (self.data.length == self.count) {
            self.res.send(self.data);
        }
    }

    self.error = function(error) {
        if (self.had_error) {
            return;
        }
        console.log("WaitingQueue.error");
        console.log(error);
        self.had_error = true;
        res.send(error);
    }
}

var info = function(req, res) {
	var id = req.query.id;
    var ids = req.query.ids;
    var user_key = req.query.user_key

    console.log("info.info");

    if (id != undefined) {
        var waiting = new WaitingQueue(1, res);
        cached_info_from_id(id, user_key, waiting)
        return;
    }

    if (ids != undefined) {
        var length = ids.length;
        var waiting = new WaitingQueue(length, res);

        console.log(ids);
        for (var i = 0; i < length; i++) {
            console.log(ids[i]);
            cached_info_from_id(ids[i], user_key, waiting)
        }
        return
    }

    console.log("res.error");
    res.send({"error":"please, inform the id or ids"});
}


var cached_info_from_id = function(_id, user_key, waiting_queue) {
	if (_id == undefined && ids == undefined) {
        console.log(_id);
        console.log(ids);
		return waiting_queue.error({"error":"id or ids not defined"});
	}

	if (user_key == undefined) {
		return waiting_queue.error({"error":"user_key not defined"});
	}

	if (_id.substring(0, 1) == "a") {
		deepblue_cache["annotations"].info(_id, user_key, waiting_queue.insert);
	}

    else if (_id.substring(0, 1) ==  "g") {
    	deepblue_cache["genomes"].info(_id, user_key, waiting_queue.insert);
	}

    else if (_id.substring(0, 2) ==  "bs") {
    	deepblue_cache["biosources"].info(_id, user_key, waiting_queue.insert);
    }

    else if (_id.substring(0, 1) ==  "s") {
    	deepblue_cache["samples"].info(_id, user_key, waiting_queue.insert);
    }

    else if (_id.substring(0, 2) ==  "em") {
    	deepblue_cache["epigenetic_marks"].info(_id, user_key, waiting_queue.insert);
    }

    else if (_id.substring(0, 1) ==  "e") {
    	experiments_cache["cache"].info(_id, user_key, waiting_queue.insert);
    }

    else if (_id.substring(0, 1) ==  "t") {
    	deepblue_cache["techniques"].info(_id, user_key, waiting_queue.insert);
    }

    else {
    	waiting_queue.error({"error":"invalid id:"+_id});
    }
}

module.exports = info;
