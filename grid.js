'use strict';

/**
 * Created
 * on 3/21/2016.
 * by:
 *
 * Felipe Albrecht
 * Obaro Odiete
 *
 */

var Q = require('q');

var experiments_cache = require('./experiments_cache');
var cache = experiments_cache["cache"];

var settings = require('./settings');
var xmlrpc = require('xmlrpc');
var xmlrpc_host = settings.xmlrpc_host();

var normalized_names = {};
normalized_names["DNA Methylation"] = "dnamethylation";
normalized_names["dna methylation"] = "dnamethylation";

var unnormalized_names = {}
unnormalized_names["dnamethylation"] = "DNA Methylation";


// filter biosource and epigenetic-marks
var EPIGENETIC_MARKS_COUNT = 15;

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
}

var get_unnormalized = function(normalized_name) {
    if (normalized_name in unnormalized_names) {
        return unnormalized_names[normalized_name];
    } else {
        // It can NEVER happens.
        console.log(normalized_name + " NOT FOUND!");
        return "XXX";
    }
}

var select_experiments = function(params, res) {
    var client = xmlrpc.createClient(xmlrpc_host);

    // Count the number of selected epigenetic marks.
    if (params[2].length == 0 || params[2].length > EPIGENETIC_MARKS_COUNT) {
        console.log("XXXXXXX");
        console.time("faceting");
        client.methodCall("collection_experiments_count", ["epigenetic_marks", params[0], params[1], params[2], params[3], params[4], params[5], params[6], params[7]], function(error, result) {

                if (error) {
                    console.log(error);
                    return res.send(error);
                }
                if (result[0] == "error") {
                    return res.send({"error": result[1]});
                }

                var em =  result[1];
                em.sort(function(a,b){return b[2] - a[2]});
                var em_names = [];

                var c1 = 0;
                var c2 = 0;
                for (var i = 0; i < EPIGENETIC_MARKS_COUNT; i++) {
                    c1 += em[i][2];
                    em_names.push(em[i][1]);
                }

                for (var i = EPIGENETIC_MARKS_COUNT; i < em.length; i++) {
                    c2 += em[i][2];
                }

                console.log(c1);
                console.log(c2);
                console.timeEnd("faceting");
                params[2] = em_names;
                get_experiments(params, res);
        });
    } else {
        get_experiments(params, res);
    }
}


var get_experiments = function (params, res) {
    console.log(params);
    var client = xmlrpc.createClient(xmlrpc_host);
    client.methodCall('list_experiments', params, function(error, result) {
        if (error) {
            console.log(error);
            return res.send(error);
        }
        if (result[0] == "error") {
            return res.send({"error": result[1]});
        }

        var experiments = result[1];

        // loop through the experiments and retrieve the following: biosource, epigenetic_mark using the cache
        //experiments = [["e56955","E016.HUES64_Cell_Line.norm.pos.wig"],['e53553', 'S00D7151.hypo_meth.bs_call.GRCh38.20150707.bed']];
        var experiments_ids = [];
        for (var e in experiments) {
            experiments_ids.push(experiments[e][0]);
        }

        build_grid(experiments_ids, params, res);
    });
}

var build_grid = function(experiments_ids, params, res) {
    var info_promisse = cache.infos(experiments_ids, params[7]);

    info_promisse.then( function(data) {
        var grid_projects = {}; //grid containing project affiliation
        var grid_experiments = {}; // grid containing id, name and project of all experiments
        var grid_data = {}; // container for returned data
        var grid_biosources = {}; // counts all the biosources
        var grid_epigenetic_marks = {}; //counts all the epigenetic marks

        var experiment_count = data.length; // experiment count

        for (var d in data) {
            var experiment_info = data[d];
            var id = experiment_info['_id'];

            var epigenetic_mark = get_normalized(experiment_info['epigenetic_mark']);
            var biosource = get_normalized(experiment_info['biosource']);
            var project = get_normalized(experiment_info['project']);

            if (epigenetic_mark in grid_epigenetic_marks) {
                grid_epigenetic_marks[epigenetic_mark] = grid_epigenetic_marks[epigenetic_mark] + 1;
            }
            else {
                grid_epigenetic_marks[epigenetic_mark] = 1;
            }

            var experiment_info = [ id ];

            if (biosource in grid_projects) {
                if (epigenetic_mark in grid_projects[biosource]) {
                    grid_projects[biosource][epigenetic_mark].push(project);
                    grid_experiments[biosource][epigenetic_mark].push(experiment_info)
                }
                else{
                    grid_experiments[biosource][epigenetic_mark] = [];
                    grid_experiments[biosource][epigenetic_mark].push(experiment_info);

                    grid_biosources[biosource] = grid_biosources[biosource] + 1;

                    grid_projects[biosource][epigenetic_mark] = [];
                    grid_projects[biosource][epigenetic_mark].push(project);
                }
            }
            else {
                grid_projects[biosource] = {};
                grid_projects[biosource][epigenetic_mark] = [];
                grid_projects[biosource][epigenetic_mark].push(project);

                grid_biosources[biosource] = 1;

                grid_experiments[biosource] = {};
                grid_experiments[biosource][epigenetic_mark] = [];
                grid_experiments[biosource][epigenetic_mark].push(experiment_info);
            }
        }

        // sort biosources and epigenetic_marks by count
        var biosource_sorted = Object.keys(grid_biosources).sort(function(a,b){return grid_biosources[b] - grid_biosources[a]});
        var epigenetic_mark_sorted = (Object.keys(grid_epigenetic_marks).sort(function(a,b){return grid_epigenetic_marks[b] - grid_epigenetic_marks[a]}));

        // sort biosources and epigenetic_marks alphabetically
        var cell_biosources = biosource_sorted.map(get_unnormalized).sort();
        var cell_epigenetic_marks = epigenetic_mark_sorted.map(get_unnormalized).sort();

        var cell_experiments_count = {}; //contains the experiment count in each cell of the filtered grid
        var cell_project = {}; //contains the project in each cell of the filtered grid
        var cell_experiments = {}; //contains the project in each cell of the filtered grid

        for (var b in cell_biosources) {
            var bio = cell_biosources[b];

            var norm_bio = get_normalized(bio);

            cell_experiments_count[bio] = {};
            cell_project[bio] = {};
            cell_experiments[bio] = {};

            for (var e in cell_epigenetic_marks) {
                var epi = cell_epigenetic_marks[e];

                var norm_epi = get_normalized(epi);

                if (norm_epi in grid_experiments[norm_bio]) {
                    cell_experiments_count[bio][epi] = grid_experiments[norm_bio][norm_epi].length;
                    cell_project[bio][epi] =  get_unnormalized(grid_projects[norm_bio][norm_epi][0]);
                    cell_experiments[bio][epi] = grid_experiments[norm_bio][norm_epi];
                }
                else {
                    cell_experiments_count[bio][epi] = 0;
                    cell_project[bio][epi] = "";
                    cell_experiments[bio][epi] = [];
                }
            }
        }

        grid_data['cell_projects'] = cell_project;
        grid_data['cell_experiments'] = cell_experiments;
        grid_data['cell_experiment_count'] = cell_experiments_count;
        grid_data['cell_biosources'] = cell_biosources;
        grid_data['cell_epigenetic_marks'] = cell_epigenetic_marks;
        grid_data['total_experiment'] = experiment_count;

        console.log("done");
        console.timeEnd("grid");

        return res.send(grid_data);
    });
};

var grid = function(req, res) {
    console.time("grid")
    var request_data;

    // If the request was sent by GET
    if (req.query.length > 0) {
        request_data = req.query;
    } else {
    // If the request was sent by POST
        request_data = req.body;
    }

    var key = request_data.key;
    var params = [];
    var request = [];
    if ("request" in request_data) {
        request = request_data.request;
    }

    // retrieve all experiment matching criteria in the request...   you need xmlrpc for this
    var collections = ['experiment-genome',"experiment-datatype", "experiment-epigenetic_mark", "experiment-biosource","experiment-sample", "experiment-technique", 'experiment-project'];
    for (var v in collections) {
        if (collections[v] in request) {
            params.push(request[collections[v]]);
            console.log(collections[v]);
        }
        else {
            params.push("");
        }
    }
    params.push(key);
    select_experiments(params, res);
};

module.exports = grid;