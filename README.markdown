This is a [couchapp][couchapp] with a bit of python to run simulations
of failures in distributed systems to help guide topology decisions.

# Requirements

- [CouchDB][couchdb]
- python
- CouchDB for python (easy_install couchdb)
- couchapp tool (easy_install couchapp)

## Erlang Views

I'm using erlang-based views here.  The erlang view engine is disabled
by default.  In order to enable it, add the following to your
`local.ini`:

    [native_query_servers]
    erlang = {couch_native_process, start_link, []}

# Running

Ensure the couchapp is installed:

    couchapp push . test

Then edit and run a simulation:

    $EDITOR tools/sim.py
    ./tools/sim.py

[couchapp]: http://couchapp.org/
[couchdb]: http://www.couchbase.com/
