function(doc) {
    if (doc.type && doc.type === 'test') {
        emit([doc.start_time, doc.algorithm, doc._id], doc);
    }
}