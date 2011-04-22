function(doc, req) {
    var mustache = require("vendor/couchapp/lib/mustache");
    var path = require("vendor/couchapp/lib/path").init(req);
    var markdown = require("vendor/couchapp/lib/markdown");

    var missing = doc.missing.map(function (x) { return parseInt(x); });
    missing.sort(function(a, b) {return parseInt(a) - parseInt(b);});

    var data = {
        title: 'Scenario ' + doc._id,
        mainid: 'scenario',
        n_alive_nodes: doc.n_alive_nodes,
        failed: doc.failed,
        n_vbuckets: doc.n_vbuckets,
        n_nodes: doc.n_nodes,
        n_dead_nodes: doc.n_dead_nodes,
        test: doc.test,
        missing: missing,
        n_missing: missing.length,
        test_link: path.show('test', doc.test),
        _id: doc._id
    };

    return mustache.to_html(this.templates.head, data) +
        mustache.to_html(this.templates.scenario, data) +
        mustache.to_html(this.templates.tail, data);
}
