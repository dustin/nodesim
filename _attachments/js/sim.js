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

    TMPL='(Data loss in {{failed}} cases, ' +
        'between {{best_loss}} and {{worst_loss}} vbs lost.' +
        ' <span class="chartjunk"">{{sseq}}</span>)';

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
                        num_success: 0,
                        seq: []
                    };
                }
                summaries[uuid].total_runs += count;
                summaries[uuid].worst_loss = Math.max(num_missing,
                                                      summaries[uuid].worst_loss);
                summaries[uuid].best_loss = Math.min(num_missing == 0 ? 65536 : num_missing,
                                                     summaries[uuid].best_loss);
                if (num_missing == 0) {
                    summaries[uuid].num_success += count;
                } else {
                    summaries[uuid].seq.push(count);
                }
            });

            for (var uuid in summaries) {
                var s = summaries[uuid];
                s.success = percentString(s.total_runs, s.num_success);
                s.failed = percentString(s.total_runs, s.total_runs - s.num_success);
                s.sseq = s.seq.join(',');
                var summary = Mustache.to_html(TMPL, s);
                $('#summary_' + uuid).html(summary);
            }
            junkify('chartjunk');
        }
    });

}

// http://nsfmc.github.com/chartjunk/
function junkify(someClass) {
    // requires underscore.js
    var sparks = document.getElementsByClassName(someClass);
    _(sparks).each(function(e,i){
        var range = 16;
        var origContent = e.innerHTML;
        e.title = "data: "+ origContent;
        var d = _(origContent.split(",")).map(function(x) {
            return parseInt(x, 10);
        }),
            max = _.max(d), min = _.min(d),
            dataRange = max-min;

        // an array like ["0","1",...,"e","f,","g"]
        var cj = _.range(17).map(function(e){return e.toString(17);});

        // remap data to start at "0" and end at "g"
        var rescaled = _(d).map(function(e){
            var idx = Math.ceil((e - min) * (range / dataRange));
            return cj[idx];
        });

        // reassemble the string and add chartjunk's junkjunk classname
        var graphText = rescaled.join("");
        e.innerHTML = graphText;
        var cns = _.uniq((e.className + " junkjunk").split(" ")).join(" ");
        e.className = cns;
    });
}
