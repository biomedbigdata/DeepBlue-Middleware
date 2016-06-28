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

var utils = require('./utils');

// filter biosource and epigenetic-marks
var EPIGENETIC_MARKS_COUNT = 15;

var select_experiments = function(params, res) {
    var client = xmlrpc.createClient(xmlrpc_host);

    // Count the number of selected epigenetic marks.
    if (params[2].length == 0 || params[2].length > EPIGENETIC_MARKS_COUNT) {
        console.log("counting epigenetic marks");
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

                for (var i = 0; em[i] != undefined &&
                                i < EPIGENETIC_MARKS_COUNT &&
                                i < em.length &&
                                em[i][1] != 0; i++) {
                    em_names.push(em[i][1]);
                }
                console.timeEnd("faceting");
                params[2] = em_names;
                get_experiments(params, res);
        });
    } else {
        get_experiments(params, res);
    }
};


var get_experiments = function (params, res) {
    console.log(params);
    var client = xmlrpc.createClient(xmlrpc_host);
    console.time("list_experiments");

    // so get the ids of experiments based on the biosources selected
    var experiments_promise = cache.list_experiments('epigenetic_marks', params);
    experiments_promise.then( function(data) {
        var experiments_ids = data; // experiment count
        console.timeEnd("list_experiments");
        build_grid(experiments_ids, params, res);
    });
};

var build_grid = function(experiments_ids, params, res) {
    console.time('build_grid');
    var info_promisse = cache.infos(experiments_ids, params[7]);
    var n_params = []; // normalized representation of params

    for (var p=0; p < params.length; p++) {
        if (params[p] instanceof Array) {
            n_params.push(utils.get_normalized_array(params[p]));
        }
        else {
            n_params.push("");
        }
    }

    info_promisse.then( function(data) {
        var grid_projects = {}; //grid containing project affiliation
        var grid_experiments = {}; // grid containing id, name and project of all experiments
        var grid_data = {}; // container for returned data
        var grid_biosources = {}; // counts all the biosources
        var grid_epigenetic_marks = {}; //counts all the epigenetic marks

        var experiment_count = data.length; // experiment count
        console.log("semi filtered experiment count: " + experiment_count);

        for (var d in data) {
            var experiment_info = data[d];
            var id = experiment_info['_id'];

            // check if the experiments is valid based on the other collection filters
            var data_type = utils.get_normalized(experiment_info['data_type']);
            // params[1] is the data-type component of the request parameters
            if((n_params[1] instanceof Array ) && (n_params[1].indexOf(data_type) < 0)){
                continue;
            }

            var project = utils.get_normalized(experiment_info['project']);
            // params[6] is the project component of the request parameters
            if((n_params[6] instanceof Array ) && (n_params[6].indexOf(project) < 0)){
                continue;
            }

            var genome = utils.get_normalized(experiment_info['genome']);
            // params[0] is the genome component of the request parameters
            if((n_params[0] instanceof Array ) && (n_params[0].indexOf(genome) < 0)){
                continue;
            }

            var technique = utils.get_normalized(experiment_info['technique']);
            // params[5] is the technique component of the request parameters
            if((n_params[5] instanceof Array ) && (n_params[5].indexOf(technique) < 0)){
                continue;
            }

            var biosource = utils.get_normalized(experiment_info['biosource']);
            // params[3] is the biosource component of the request parameters
            if((n_params[3] instanceof Array ) && (n_params[3].indexOf(biosource) < 0)){
                continue;
            }

            var epigenetic_mark = utils.get_normalized(experiment_info['epigenetic_mark']);
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
        var cell_biosources = biosource_sorted.map(utils.get_unnormalized).sort();
        var cell_epigenetic_marks = epigenetic_mark_sorted.map(utils.get_unnormalized).sort();

        var cell_experiments_count = {}; //contains the experiment count in each cell of the filtered grid
        var cell_project = {}; //contains the project in each cell of the filtered grid
        var cell_experiments = {}; //contains the project in each cell of the filtered grid

        for (var b in cell_biosources) {
            var bio = cell_biosources[b];

            var norm_bio = utils.get_normalized(bio);

            cell_experiments_count[bio] = {};
            cell_project[bio] = {};
            cell_experiments[bio] = {};

            for (var e in cell_epigenetic_marks) {
                var epi = cell_epigenetic_marks[e];

                var norm_epi = utils.get_normalized(epi);

                if (norm_epi in grid_experiments[norm_bio]) {
                    cell_experiments_count[bio][epi] = grid_experiments[norm_bio][norm_epi].length;
                    cell_project[bio][epi] =  utils.get_unnormalized(grid_projects[norm_bio][norm_epi][0]);
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
        console.timeEnd('build_grid');
        return res.send(grid_data);
    });
};

var grid = function(req, res) {
    console.time("grid");
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
    var collections = ['experiment-genome',"experiment-datatype", "experiment-epigenetic_mark", "experiment-biosource",
        "experiment-sample", "experiment-technique", 'experiment-project'];
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