function(doc) {
    if (doc.type && doc.type === 'test') {
        emit([doc.algorithm, doc.start_time, doc._id], doc);
    }
}