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
        send("<ul>");

        while(row = getRow()) {
            send(Mustache.to_html(templates.sim, {
                id: row.value._id,
                alg: row.value.algorithm,
                started: row.value.start_time,
                n_servers: row.value.nodes.length,
                show: path.show('test', row.value._id)
            }));
        }
        send("</ul>");
        send(Mustache.to_html(templates.tail, data));
    });
}
