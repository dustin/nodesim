function(doc) {
  if (doc.missing && doc.missing.length > 0) {
      var failed = doc.failed.map(function(n) {
          return parseInt(n.id);
      }).sort(function (a, b) { return a - b; });
      emit([doc.test, doc.n_dead_nodes],
           {"algorithm": doc.algorithm,
            "missing": doc.missing,
            "n_missing": doc.missing.length,
            "down": doc.n_dead_nodes,
            "up": doc.n_alive_nodes,
            "failed": failed});
  }
}
