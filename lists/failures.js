function(head, req) {
    // !json templates.head
    // !json templates.failure
    // !json templates.tail

    provides("html", function() {
        var row;

        var data = {
            title: "Failure List for Simulation",
            mainid: "faillist"
        };

        var Mustache = require("vendor/couchapp/lib/mustache");
        var path = require("vendor/couchapp/lib/path").init(req);

        send(Mustache.to_html(templates.head, data));
        send("<h1>List of Failures</h1><ul>");

        while(row = getRow()) {
            send(Mustache.to_html(templates.failure, {
                id: row.id,
                test: row.key[0],
                n_dead_nodes: row.key[1],
                n_missing: row.value.missing.length,
                failed: row.value.failed,
                missing: row.value.missing,
                show: path.show('scenario', row.id)
            }));
        }
        send("</ul>");
        send(Mustache.to_html(templates.tail, data));
    });
}