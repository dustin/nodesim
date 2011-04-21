function(me, args) {
    var app = $$(this).app;
    var path = app.require("vendor/couchapp/lib/path").init(app.req);

    var failures = [];
    var failure_data = [];
    var total_runs = 0;

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
                losses: []
            };
            failures[k[1]] = old;
        }
        failures[k[1]].total = old.total + r.value;
        failures[k[1]].losses[k[2]] = r.value;
        failure_data[k[1]] = failure_data[k[1]] + r.value;

        total_runs += r.value;
    }

    $("#iterations").html(total_runs);

    function showBar(named, data) {
        var w = 200;
        var h = 200;

        var vis = new pv.Panel()
            .canvas(named)
            .width(w)
            .height(h)
            .bottom(20)
            .left(20)
            .right(10)
            .top(5);

        var vals = [];
        var labels = [];
        var max = 0;
        for (var i = 0; i < data.length; ++i) {
            if (data[i]) {
                labels.push(i);
                vals.push(data[i]);
                max = Math.max(max, data[i]);
            }
        }

        var x = pv.Scale.linear(0, max).range(0, h);
        var y = pv.Scale.ordinal(pv.range(labels.length)).splitBanded(0, w, 4/5);

        var bar = vis.add(pv.Bar)
            .data(vals)
            .bottom(0)
            .width(19)
            .height(function(d) {return x(d);})
            .left(function() { return this.index * 24 + 5; })
          .anchor("bottom").add(pv.Label)
            .textMargin(10)
            .textAlign("left")
            .textBaseline("middle")
            .textAngle(-Math.PI / 2)
            .text(function() { return labels[this.index] + ": " + vals[this.index]; });

        vis.render();
    }

    showBar('fail_dist', failure_data);
    for (var i = 0; i < failures.length; ++i) {
        showBar("loss_at_" + i, failures[i].losses);
    }
}
