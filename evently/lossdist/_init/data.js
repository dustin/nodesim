function(data) {
    var app = $$(this).app;
    var path = app.require("vendor/couchapp/lib/path").init(app.req);

    var failures = [];
    var total_runs = 0;
    var worst_loss = 0;

    for (var i = 0; i < data.rows.length; ++i) {
        var r = data.rows[i];
        var k = r.key;
        var old = failures[k[1]];
        if (!old) {
            old = {
                size: k[1],
                link: path.list('failures', 'find_missing', {startkey: [k[0], k[1]],
                                                             endkey: [k[0], k[1], {}],
                                                             reduce: false}),
                total: 0,
                losses: {}
            };
            failures[k[1]] = old;
        }
        failures[k[1]].total = old.total + r.value;
        failures[k[1]].losses[k[2]] = r.value;
        total_runs += r.value;
        worst_loss = Math.max(worst_loss, k[2]);
    }

    return {
        total_runs: total_runs,
        by_failures: failures,
        worst_loss: worst_loss,
        results: data.rows.map(function(r) {
            var k = r.key;
            var count = r.value;
            return {
                failures: k[1],
                loss: k[2],
                count: count
            };
        })};
}
