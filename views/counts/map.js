function(doc) {
  if (doc.n_alive_nodes) {
    emit([doc.test, doc.n_dead_nodes, doc.missing.length],
         {failed: doc.failed,
          missing: doc.missing});
  }
}
