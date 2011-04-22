function(me, args) {
    var app = $$(this).app;
    var path = app.require("vendor/couchapp/lib/path").init(app.req);

    var failures = [];
    var failure_data = [];
    var loss_dist_data = [];
    var total_runs = 0;

    // Make sure failure data is filled in even when there's no data
    // for a position.
     for (var i = 0; i <= me.rows[me.rows.length-1].key[1]; ++i) {
        failure_data[i] = 0;
    }

    function addTo(a, b) {
        return (a?a:0) + (b?b:0);
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

        loss_dist_data[k[2]] = addTo(loss_dist_data[k[2]], r.value);

        total_runs += r.value;
    }

    $("#iterations").html(total_runs);

    function showBar(named, data, total) {
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

        var barWidth = 24;
        var w = (barWidth + 5) * labels.length;
        var h = 200;

        var vis = new pv.Panel()
            .canvas(named)
            .width(w)
            .height(h)
            .bottom(20)
            .left(20)
            .right(10)
            .top(5);

        var x = pv.Scale.linear(0, max).range(0, h);
        var y = pv.Scale.ordinal(pv.range(labels.length)).splitBanded(0, w, 4/5);

        function maybePercent(n) {
            if (total) {
                var percent = (100 * n) / total;
                var integerPart = Math.floor(percent);
                var decimalPart = Math.floor((percent - integerPart) * 100);
                var pstring = integerPart + "." + decimalPart;
                return " (" + pstring + "%)";
            } else {
                return "";
            }
        }

        var bar = vis.add(pv.Bar)
            .data(vals)
            .bottom(15)
            .width(19)
            .height(function(d) {return x(d);})
            .left(function() { return this.index * 24 + 5; })
          .anchor("bottom").add(pv.Label)
            .textMargin(function(d) {
                var v = labels[this.index];
                var mag = Math.floor(Math.log(Math.max(2, v)) / Math.log(10));
                return -8 * (1 + mag);})
            .textAlign("left")
            .textBaseline("middle")
            .textAngle(-Math.PI / 2)
            .text(function() { return labels[this.index];})
          .anchor("bottom").add(pv.Label)
            .textMargin(10)
            .textAlign("left")
            .textBaseline("middle")
            .textAngle(-Math.PI / 2)
            .text(function() { return vals[this.index] + maybePercent(vals[this.index]); });

        vis.add(pv.Rule)
            .bottom(15)
            .left(24)
            .right(6);

        vis.render();
    }

    showBar('fail_dist', failure_data, total_runs);
    showBar('loss_dist_chart', loss_dist_data, total_runs);

    for (var i = 0; i < failures.length; ++i) {
        if (failures[i]) {
            var totalLost = 0;
            var worstLoss = 0;
            for (var j = 1; j < failures[i].losses.length; ++j) {
                if (failures[i].losses[j]) {
                    totalLost += failures[i].losses[j];
                    worstLoss = Math.max(worstLoss, j);
                }
            }
            $("#loss_count_" + i).html(totalLost);
            $("#worst_loss_" + i).html(worstLoss);
            if (totalLost > 0) {
                showBar("loss_at_" + i, failures[i].losses, failures[i].total);
            } else {
                $("#failure_reports_" + i).hide();
                $("#loss_at_" + i).html("<p>No losses detected.</p>");
            }
        }
    }
}
