function(head, req) {
    // !json templates.head
    // !json templates.sim
    // !json templates.tail

    provides("html", function() {
        var row;

        var data = {
            title: "Simulation List",
            mainid: "simlist"
        };

        var Mustache = require("vendor/couchapp/lib/mustache");
        var path = require("vendor/couchapp/lib/path").init(req);

        send(Mustache.to_html(templates.head, data));
        send("<h1>List of Simulations</h1><ul>");

        while(row = getRow()) {
            send(Mustache.to_html(templates.sim, {
                id: row.id,
                alg: row.doc.algorithm,
                started: row.doc.start_time,
                n_servers: row.doc.nodes.length,
                n_iters: row.doc.n_iters,
                n_replicas: row.doc.n_replicas ? row.doc.n_replicas : 1,
                show: path.show('test', row.id)
            }));
        }
        send("</ul>");
        send(Mustache.to_html(templates.tail, data));
    });
}
