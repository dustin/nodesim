#!/usr/bin/env python

import uuid
import random
import datetime
import itertools

import couchdb

NUM_TESTS = 10000
BATCH_SIZE = 1000

NODE_FAILURE_PROBABILITY = 0.01
NODES = 15
VBUCKETS = 1024
REPLICAS = 1
ALG = 'least'


R = random.Random()

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

def buildNodesAdjacent():
    nodes = [Node(x) for x in range(NODES)]

    # Layout active
    distribution_circle = itertools.cycle(nodes)
    for i in range(VBUCKETS):
        next(distribution_circle).active.append(i)

    for r in range(REPLICAS):
        # next node in the circle gets the replica
        distribution_circle = itertools.cycle(nodes)

        for i in range(r+1):
            next(distribution_circle)
        for i in range(VBUCKETS):
            next(distribution_circle).replica.append(i)

    return nodes

def buildNodesWide():
    nodes = [Node(x) for x in range(NODES)]

    # Layout active
    distribution_circle = itertools.cycle(nodes)
    for i in range(VBUCKETS):
        next(distribution_circle).active.append(i)

    # Layout replicas, spread 'em all around
    for n in nodes:
        for i in range(REPLICAS):
            for v in n.active:
                target = next(distribution_circle)
                while v in target.active or v in target.replica:
                    target = next(distribution_circle)
                target.replica.append(v)

    return nodes

def buildNodesLeast():
    nodes = [Node(x) for x in range(NODES)]

    # Layout active
    distribution_circle = itertools.cycle(nodes)
    for i in range(VBUCKETS):
        next(distribution_circle).active.append(i)

    # Layout replicas by sending each vbucket to the least loaded node.
    for n in nodes:
        for i in range(REPLICAS):
            for v in n.active:
                snodes = iter(sorted(nodes, cmp=lambda a, b: len(a.replica) - len(b.replica)))
                target = next(snodes)
                while v in target.active or v in target.replica:
                    target = next(snodes)
                target.replica.append(v)

    return nodes

SAVING = []

def saveResults(db, nid, nodes, got, missing, alg):

    failed_nodes = [{'id': n.id,
                     'active': n.active,
                     'replica': n.replica,
                     'failed': n.failed}
                    for n in nodes if n.failed]

    doc = couchdb.Document(_id=str(uuid.uuid1()))
    doc.update({
            'test': nid,
            'n_nodes': NODES,
            'n_vbuckets': VBUCKETS,
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

def simulate(db, nodes, nid, alg):
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
        assert cnt == (REPLICAS + 1)

    l = sorted(set(flatten([flatten(n.available()) for n in nodes])))
    got = set(l)
    missing = []
    if len(l) < VBUCKETS:
        print len(l)
        expected = set(range(VBUCKETS))
        missing = expected - got
        print missing

    saveResults(db, nid, nodes, got, missing, alg)

def persistTest(db, nodes, nid, alg):

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
        'n_iters': NUM_TESTS,
        'n_replicas': REPLICAS,
        'start_time': datetime.datetime.now().isoformat()
        }
    db.save(doc)


if __name__ == '__main__':
    db = couchdb.Server('http://127.0.0.1:5984/')['test']
    algs = {
        'least': buildNodesLeast,
        'wide': buildNodesWide,
        'adjacent': buildNodesAdjacent
        }
    nodes = algs[ALG]()

    nid = str(uuid.uuid1())
    persistTest(db, nodes, nid, ALG)

    for i in range(NUM_TESTS):
        simulate(db, nodes, nid, ALG)

    db.update(SAVING)
