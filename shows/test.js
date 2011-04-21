function(doc, req) {
    var mustache = require("vendor/couchapp/lib/mustache");
    var path = require("vendor/couchapp/lib/path").init(req);
    var markdown = require("vendor/couchapp/lib/markdown");

    var vbcount = 0;
    // Right now, they all have the same thing.
    var fail_prob = doc.nodes[0].p;
    for (var i = 0; i < doc.nodes.length; ++i) {
        vbcount += doc.nodes[i].active.length;
    }

    var data = {
        title: 'Simulation ' + doc.algorithm + " / " + doc.start_time,
        mainid: 'simulation',
        algorithm: doc.algorithm,
        start_time: doc.start_time,
        _id: doc._id,
        n_nodes: doc.nodes.length,
        n_vbuckets: vbcount,
        fail_prob: fail_prob
    };

    return mustache.to_html(this.templates.head, data) +
        mustache.to_html(this.templates.test, data) +
        mustache.to_html(this.templates.tail, data);
}