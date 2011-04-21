function(data) {
    var app = $$(this).app;
    var path = app.require("vendor/couchapp/lib/path").init(app.req);

    return {
        results: data.rows.map(function(r) {
            var k = r.key;
            var count = r.value;
            return {
                failures: k[1],
                count: count
            };
        })};
}
