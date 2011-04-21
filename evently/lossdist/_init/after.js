function(me, args) {
    var app = $$(this).app;
    var path = app.require("vendor/couchapp/lib/path").init(app.req);

    var failures = [];
    var failure_data = [];
    var total_runs = 0;
    var max = 0;

    // Make sure failure data is filled in even when there's no data
    // for a position.
     for (var i = 0; i <= me.rows[me.rows.length-1].key[1]; ++i) {
        failure_data[i] = 0;
    }

    for (var i = 0; i < me.rows.length; ++i) {
        var r = me.rows[i];
        var k = r.key;
        var old = failures[k[1]];
        if (!old) {
            old = {
                total: 0,
                losses: {}
            };
            failures[k[1]] = old;
        }
        failures[k[1]].total = old.total + r.value;
        failures[k[1]].losses[k[2]] = r.value;
        failure_data[k[1]] = failure_data[k[1]] + r.value;

        total_runs += r.value;
        max = Math.max(max, me.rows[i].value);
    }

    $("#iterations").html(total_runs);

    var w = 200;
    var h = 200;

    var vis = new pv.Panel()
        .canvas('fail_dist')
        .width(w)
        .height(h)
        .bottom(20)
        .left(20)
        .right(10)
        .top(5);

    var x = pv.Scale.linear(0, max).range(0, h);
    var y = pv.Scale.ordinal(pv.range(failure_data.length)).splitBanded(0, w, 4/5);

    var bar = vis.add(pv.Bar)
        .data(failure_data)
        .bottom(0)
        .width(19)
        .height(function(d) {return x(d);})
        .left(function() { return this.index * 24 + 5; })
      .anchor("bottom").add(pv.Label)
        .textMargin(10)
        .textAlign("left")
        .textBaseline("middle")
        .textAngle(-Math.PI / 2)
        .text(function() { return this.index + ": " + failure_data[this.index]; });

    vis.render();
}
