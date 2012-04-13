#!/usr/bin/env python

import sys
import uuid
import random
import getopt
import datetime
import itertools
import traceback

import couchdb

COUCH_SERVER = 'http://127.0.0.1:5984/'
COUCH_DB = 'simulation'

NUM_TESTS = 100000
BATCH_SIZE = 1000

NODE_FAILURE_PROBABILITY = 0.01
NODES = 15
VBUCKETS = 1024
REPLICAS = 2
# adjacent, least
ALG = 'adjacent'

R = random.Random()

def usage(msg=None):
    if msg is not None:
        sys.stderr.write("*** " + msg.strip() + "\n")
    sys.stderr.write(\
"""Usage:  %s [-s dburl] [-d dbname] [-a alg] [-i num_tests]
        %s [-n num_nodes] [-v num_vbuckets] [-r num_replicas]

Known algorithms: adjacent, least
""" % (sys.argv[0], " " * len(sys.argv[0])))
    sys.exit(-1)

class Node(object):

    p = NODE_FAILURE_PROBABILITY
    failed = False

    def __init__(self, i):
        self.id = i
        self.active = []
        self.replica = []

    def maybeFail(self):
        self.failed = R.random() < self.p
        return self.failed

    def available(self):
        if self.failed:
            return [], []
        else:
            return self.active, self.replica

    def invariant(self):
        return not set(self.active).intersection(set(self.replica))

    def __repr__(self):
        return "<Node active=%d, replica=%d>" % (len(self.active),
                                                 len(self.replica))

def flatten(lists):
    return list(itertools.chain(*lists))

def buildNodesAdjacent(nodes, vbuckets, replicas):
    nodes = [Node(x) for x in range(nodes)]

    # Layout active
    distribution_circle = itertools.cycle(nodes)
    for i in range(vbuckets):
        next(distribution_circle).active.append(i)

    for r in range(replicas):
        # next node in the circle gets the replica
        distribution_circle = itertools.cycle(nodes)

        for i in range(r+1):
            next(distribution_circle)
        for i in range(vbuckets):
            next(distribution_circle).replica.append(i)

    return nodes

def buildNodesWide(nodes, vbuckets, replicas):
    nodes = [Node(x) for x in range(nodes)]

    # Layout active
    distribution_circle = itertools.cycle(nodes)
    for i in range(vbuckets):
        next(distribution_circle).active.append(i)

    # Layout replicas, spread 'em all around
    for n in nodes:
        for i in range(replicas):
            for v in n.active:
                target = next(distribution_circle)
                while v in target.active or v in target.replica:
                    target = next(distribution_circle)
                target.replica.append(v)

    return nodes

def buildNodesLeast(nodes, vbuckets, replicas):
    nodes = [Node(x) for x in range(nodes)]

    # Layout active
    distribution_circle = itertools.cycle(nodes)
    for i in range(vbuckets):
        next(distribution_circle).active.append(i)

    # Layout replicas by sending each vbucket to the least loaded node.
    for n in nodes:
        for i in range(replicas):
            for v in n.active:
                snodes = iter(sorted(nodes, cmp=lambda a, b: len(a.replica) - len(b.replica)))
                target = next(snodes)
                while v in target.active or v in target.replica:
                    target = next(snodes)
                target.replica.append(v)

    return nodes

SAVING = []

def saveResults(db, nid, nodes, vbuckets, got, missing, alg):

    failed_nodes = [{'id': n.id,
                     'active': n.active,
                     'replica': n.replica,
                     'failed': n.failed}
                    for n in nodes if n.failed]

    doc = couchdb.Document(_id=str(uuid.uuid1()))
    doc.update({
            'test': nid,
            'n_nodes': len(nodes),
            'n_vbuckets': vbuckets,
            'n_dead_nodes': len(failed_nodes),
            'n_alive_nodes': len(nodes) - len(failed_nodes),
            'failed': failed_nodes,
            'missing': list(missing)
            })

    global SAVING
    SAVING.append(doc)

    if len(SAVING) > BATCH_SIZE:
        print "Storing a batch"
        db.update(SAVING)
        SAVING = []

def simulate(db, nodes, replicas, vbuckets, nid, alg):
    fail = {True: 0, False: 0}
    seen = []
    for n in nodes:
        assert n.invariant()
        seen.extend(n.active)
        seen.extend(n.replica)
        fail[n.maybeFail()] += 1
    print fail
    for v,vc in itertools.groupby(sorted(seen)):
        cnt = len(list(vc))
        assert cnt == (replicas + 1)

    l = sorted(set(flatten([flatten(n.available()) for n in nodes])))
    got = set(l)
    missing = []
    if len(l) < vbuckets:
        print len(l)
        expected = set(range(vbuckets))
        missing = expected - got
        print missing

    saveResults(db, nid, nodes, vbuckets, got, missing, alg)

def persistTest(db, num_tests, nodes, replicas, nid, alg):

    nl = [{'active': n.active,
           'replica': n.replica,
           'id': n.id,
           'p': n.p}
          for n in nodes]

    doc = {
        '_id': nid,
        'algorithm': alg,
        'type': 'test',
        'nodes': nl,
        'n_iters': num_tests,
        'n_replicas': replicas,
        'start_time': datetime.datetime.now().isoformat()
        }
    db.save(doc)


ALGS = {
    'least': buildNodesLeast,
    'wide': buildNodesWide,
    'adjacent': buildNodesAdjacent
    }

if __name__ == '__main__':

    server = COUCH_SERVER
    dbname = COUCH_DB
    alg = ALG
    num_tests = NUM_TESTS
    vbuckets = VBUCKETS
    num_nodes = NODES
    replicas = REPLICAS

    try:
        opts, args = getopt.getopt(sys.argv[1:], 's:d:a:i:n:v:r:')

        for pair in opts:
            if pair[0]=='-s': server = pair[1]
            elif pair[0]=='-d': dbname = pair[1]
            elif pair[0]=='-a': alg = pair[1]
            elif pair[0]=='-n': num_nodes = int(pair[1])
            elif pair[0]=='-i': num_tests = int(pair[1])
            elif pair[0]=='-v': vbuckets = int(pair[1])
            elif pair[0]=='-r': replicas = int(pair[1])
    except getopt.GetoptError, e:
        usage(''.join(traceback.format_exception_only(e[0], e[1])))
    except ValueError:
        usage()

    db = couchdb.Server(server)[dbname]
    nodes = ALGS[alg](num_nodes, vbuckets, replicas)

    nid = str(uuid.uuid1())
    persistTest(db, num_tests, nodes, vbuckets, nid, alg)

    for i in range(num_tests):
        simulate(db, nodes, replicas, vbuckets, nid, alg)

    db.update(SAVING)
