function(head, req) {
    // !json templates.indexhead
    // !json templates.sim
    // !json templates.indextail

    provides("html", function() {
        var row;

        var data = {
            title: "Simulation List",
            mainid: "simlist"
        };

        var Mustache = require("vendor/couchapp/lib/mustache");
        var path = require("vendor/couchapp/lib/path").init(req);

        send(Mustache.to_html(templates.indexhead, data));

        while(row = getRow()) {
            send(Mustache.to_html(templates.sim, {
                id: row.value._id,
                alg: row.value.algorithm,
                started: row.value.start_time,
                n_servers: row.value.nodes.length,
                n_iters: row.value.n_iters,
                n_replicas: row.value.n_replicas ? row.value.n_replicas : 1,
                show: path.show('test', row.value._id)
            }));
        }
        send(Mustache.to_html(templates.indextail, data));
    });
}
