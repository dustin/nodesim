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
        send("<h1>List of Failures</h1>");

        var by_size = {};
        var unique_keys = {};

        while( (row = getRow()) ) {
            var len = row.value.missing.length;
            if (!by_size[len]) {
                by_size[len] = [];
            }
            var dead_str = row.value.failed.join(", ");
            if (unique_keys[dead_str]) {
                ++unique_keys[dead_str];
            } else {
                unique_keys[dead_str] = 1;
                by_size[len].push({
                    id: row.id,
                    test: row.key[0],
                    n_dead_nodes: parseInt(row.key[1]),
                    dead_str: dead_str,
                    n_missing: row.value.missing.length,
                    failed: row.value.failed,
                    missing: row.value.missing,
                    show: path.show('scenario', row.id)
                });
            }
        }

        var sizes = [];
        for (var k in by_size) {
            sizes.push([k, by_size[k].sort(function (a,b) {
                return a.failed < b.failed ? -1 : 1;
            })]);
        }
        sizes.sort(function(a, b) { return a[0] - b[0];});

        for (var i = 0; i < sizes.length; ++i) {
            send("<h2>Losing " + sizes[i][0] + " VBuckets</h2><ul>");
            var failures = sizes[i][1];
            for (var j = 0; j < failures.length; ++j) {
                failures[j].times = unique_keys[failures[j].dead_str];
                send(Mustache.to_html(templates.failure, failures[j]));
            }
            send("</ul>");
        }

        send(Mustache.to_html(templates.tail, data));
    });
}