function(me, args) {
    var app = $$(this).app;
    var path = app.require("vendor/couchapp/lib/path").init(app.req);

    var total_runs = 0;
    for (var i = 0; i < me.rows.length; ++i) {
        total_runs += me.rows[i].value;
    }

    $("#iterations").html(total_runs);

    var data = [];
    var max = 0;
    for (var i = 0; i < me.rows.length; ++i) {
        data[me.rows[i].key[1]] = me.rows[i].value;
        max = Math.max(max, me.rows[i].value);
    }

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
    var y = pv.Scale.ordinal(pv.range(me.rows.length)).splitBanded(0, w, 4/5);

    var bar = vis.add(pv.Bar)
        .data(data)
        .bottom(0)
        .width(19)
        .height(function(d) {return x(d);})
        .left(function() { return this.index * 24 + 5; })
      .anchor("bottom").add(pv.Label)
        .textMargin(10)
        .textAlign("left")
        .textBaseline("middle")
        .textAngle(-Math.PI / 2);

    /* The variable label. */
    // bar.anchor("bottom").add(pv.Label)
    //     .textMargin(0)
    //     .textAlign("bottom")
    //     .textBaseline("bottom")
    //     .text(function() { return me.rows[this.index].key[1];});

    vis.render();
}
