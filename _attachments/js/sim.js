function percentString(total, n) {
    var percent = (100 * n) / total;
    var integerPart = Math.floor(percent);
    var decimalPart = Math.floor((percent - integerPart) * 100);
    var pstring = integerPart + "." + decimalPart;
    return pstring + "%";
}

function maybePercent(total, n) {
    if (total) {
        return " (" + percentString(total, n) + ")";
    } else {
        return "";
    }
}

function simUpdateSummaries(app) {
    var Mustache = app.require("vendor/couchapp/lib/mustache");

    TMPL='(Data loss in {{failed}} cases, between {{best_loss}} and {{worst_loss}} vbs lost.)';

    app.db.view('simulation/counts', {
        group: true,
        reduce: true,
        success: function(d) {
            var summaries = {};
            d.rows.forEach(function(r) {
                var uuid = r.key[0],
                    dead_nodes = r.key[1],
                    num_missing = r.key[2],
                    count = r.value;

                if (!summaries[uuid]) {
                    summaries[uuid] = {
                        total_runs: 0,
                        worst_loss: 0,
                        best_loss: 65536,
                        num_success: 0
                    };
                }
                summaries[uuid].total_runs += count;
                summaries[uuid].worst_loss = Math.max(num_missing,
                                                      summaries[uuid].worst_loss);
                summaries[uuid].best_loss = Math.min(num_missing == 0 ? 65536 : num_missing,
                                                     summaries[uuid].best_loss);
                if (num_missing == 0) {
                    summaries[uuid].num_success += count;
                }
            });

            for (var uuid in summaries) {
                var s = summaries[uuid];
                s.success = percentString(s.total_runs, s.num_success);
                s.failed = percentString(s.total_runs, s.total_runs - s.num_success);
                var summary = Mustache.to_html(TMPL, s);
                console.log(summary);
                $('#summary_' + uuid).text(summary);
            }
        }
    });

}