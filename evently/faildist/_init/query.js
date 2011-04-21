function() {
    var docid = $$("#testinfo").docid;
    return {
        view : "counts",
        endkey : [docid, {}],
        startkey : [docid],
        group: true,
        reduce: true,
        group_level: 2
    };
};
