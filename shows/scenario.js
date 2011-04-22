function(doc, req) {
    var mustache = require("vendor/couchapp/lib/mustache");
    var path = require("vendor/couchapp/lib/path").init(req);
    var markdown = require("vendor/couchapp/lib/markdown");

    var missing = doc.missing.map(function (x) { return parseInt(x); });
    missing.sort(function(a, b) {return parseInt(a) - parseInt(b);});

    var nodes_contributing_obs = {};
    function contains(n, h) {
        for (var i = 0; i < h.length; ++i) {
            if (h[i] === n) {
                return true;
            }
        }
        return false;
    }
    for (var i = 0; i < doc.failed.length; ++i) {
        for (var m = 0; m < missing.length; ++m) {
            if (contains(missing[m], doc.failed[i].active) ||
                contains(missing[m], doc.failed[i].replica)) {
                nodes_contributing_obs[parseInt(doc.failed[i].id)] = true;
            }
        }
    }

    var nodes_contributing = [];
    for (var n in nodes_contributing_obs) {
        nodes_contributing.push(n);
    }
    nodes_contributing.sort(function(a, b){return a - b;});

    var data = {
        title: doc.n_dead_nodes + ' out of ' + doc.n_nodes + ' Causing Data Loss',
        mainid: 'scenario',
        n_alive_nodes: doc.n_alive_nodes,
        failed: doc.failed,
        n_vbuckets: doc.n_vbuckets,
        n_nodes: doc.n_nodes,
        n_dead_nodes: doc.n_dead_nodes,
        test: doc.test,
        missing: missing,
        n_missing: missing.length,
        nodes_contributing: nodes_contributing,
        n_nodes_contributing: nodes_contributing.length,
        test_link: path.show('test', doc.test),
        _id: doc._id
    };

    return mustache.to_html(this.templates.head, data) +
        mustache.to_html(this.templates.scenario, data) +
        mustache.to_html(this.templates.tail, data);
}
