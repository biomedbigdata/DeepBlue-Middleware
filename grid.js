/**
 * Created
 * on 3/21/2016.
 * by:
 *
 * Felipe Albrecht
 * Obaro Odiete
 *
 */

var xmlrpc = require('xmlrpc');
var experiments_cache = require('./experiments_cache');
var settings = require('./settings');

var list_experiments = function(params, user_key, res) {
    var client = xmlrpc.createClient(xmlrpc_host);
    var cache = experiments_cache["cache"];

    client.methodCall('list_experiments', params, function(error, result) {
        if (error) {
            console.log(error);
            return res.send(error);
        }
        if (result[0] == "error") {
            return res.send({"error": result[1]});
        }

        var experiments = result[1];
        console.log(experiments.length);

        // loop through the experiments and retrieve the following: biosource, epigenetic_mark using the cache
        //experiments = [["e56955","E016.HUES64_Cell_Line.norm.pos.wig"],['e53553', 'S00D7151.hypo_meth.bs_call.GRCh38.20150707.bed']];
        var ids = [];
        for (var e in experiments) {
            ids.push(experiments[e][0]);
        }

        console.log(ids);
        cache.infos(ids, user_key, function(error, data){
            var grid_projects = {};
            var grid_experiments = {};
            var grid_data = {};

            for (var d in data) {
                var experiment_info = data[d];
                var id = experiment_info['_id'];
                var biosource = experiment_info['biosource'];
                var epigenetic_mark = experiment_info['epigenetic_mark'];
                var project = experiment_info['project'];
                var name = experiment_info['name'];

                if (biosource in grid_projects) {
                    if (epigenetic_mark in grid_projects[biosource]) {
                        grid_projects[biosource][epigenetic_mark].push(project);
                        grid_experiments[biosource][epigenetic_mark].push([id, name, project])
                    }
                }
                else {
                    grid_projects[biosource] = {};
                    grid_projects[biosource][epigenetic_mark] = [];
                    grid_projects[biosource][epigenetic_mark].push(project);

                    grid_experiments[biosource] = {};
                    grid_experiments[biosource][epigenetic_mark] = [];
                    grid_experiments[biosource][epigenetic_mark].push([id, name, project]);
                }
            }

            //console.log(grid_projects);
            //console.log(grid_experiments);
            grid_data['projects'] = grid_projects;
            grid_data['experiments'] = grid_experiments;
            grid_data['biosources'] = "";
            grid_data['epigenetic_marks'] = "";

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
    for (v in vocabs) {
        if (vocabs[v] in request) {
            params.push(req.query.request[vocabs[v]]);
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