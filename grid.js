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

var list_experiments = function(params, user_key, res) {
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
        var ids = [];
        for (var e in experiments) {
            ids.push(experiments[e][0]);
        }

        cache.infos(ids, user_key).then( function(data) {
            var grid_projects = {}; //grid containing project affiliation
            var grid_experiments = {}; // grid containing id, name and project of all experiments
            var grid_data = {}; // container for returned data
            var grid_biosources = {}; // counts all the biosources
            var grid_epigenetic_marks = {}; //counts all the epigenetic marks

            var experiment_count = ids.length; // experiment count

            for (var d in data) {
                var experiment_info = data[d];
                var id = experiment_info['_id'];
                var biosource = get_normalized(experiment_info['biosource']);
                var epigenetic_mark = get_normalized(experiment_info['epigenetic_mark']);
                var project = get_normalized(experiment_info['project']);

                var name = experiment_info['name'];

                if (epigenetic_mark in grid_epigenetic_marks) {
                    grid_epigenetic_marks[epigenetic_mark] = grid_epigenetic_marks[epigenetic_mark] + 1;
                }
                else {
                    grid_epigenetic_marks[epigenetic_mark] = 1;
                }

                if (biosource in grid_projects) {
                    if (epigenetic_mark in grid_projects[biosource]) {
                        grid_projects[biosource][epigenetic_mark].push(project);
                        grid_experiments[biosource][epigenetic_mark].push([id, name, project])
                    }
                    else{
                        grid_experiments[biosource][epigenetic_mark] = [];
                        grid_experiments[biosource][epigenetic_mark].push([id, name, project]);

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
                    grid_experiments[biosource][epigenetic_mark].push([id, name, project]);
                }
            }

            // filter biosource and epigenetic-marks
            var filter_biosource = 40;
            var filter_epigenetic_mark = 15;

            // sort biosources and epigenetic_marks by count
            var biosource_sorted = (Object.keys(grid_biosources).sort(function(a,b){return grid_biosources[b] - grid_biosources[a]})).slice(0,filter_biosource);
            var epigenetic_mark_sorted = (Object.keys(grid_epigenetic_marks).sort(function(a,b){return grid_epigenetic_marks[b] - grid_epigenetic_marks[a]})).slice(0,filter_epigenetic_mark);

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

            return res.send(grid_data);
        });
    });
};

var grid = function(req, res) {
    console.log(req.query);
    var key = req.query.key;
    var params = [];
    var request = [];
    if ("request" in req.query) {
        request = req.query.request;
    }

    // retrieve all experiment matching criteria in the request...   you need xmlrpc for this
    var vocabs = ['experiment-genome',"experiment-datatype", "experiment-epigenetic_mark", "experiment-biosource","experiment-sample", "experiment-technique", 'experiment-project'];
    for (var v in vocabs) {
        if (vocabs[v] in request) {
            params.push(request[vocabs[v]]);
            console.log(vocabs[v]);
        }
        else {
            params.push("");
        }
    }
    console.log(params);
    params.push(key);
    list_experiments(params, key, res);
};

module.exports = grid;