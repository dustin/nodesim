function() {
    var docid = $$("#testinfo").docid;
    return {
        view : "indexes/counts",
        endkey : [docid, {}],
        startkey : [docid],
        group: true,
        reduce: true
    };
};
