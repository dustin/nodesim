function(doc) {
  if (doc.missing && doc.missing.length > 0) {
    emit(null, {"algorithm": doc.algorithm,
                "missing": doc.missing,
                "n_missing": doc.missing.length,
                "down": doc.n_dead_nodes,
                "up": doc.n_alive_nodes});
  }
}