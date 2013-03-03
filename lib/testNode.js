'use strict';

var EventEmitter = require('events').EventEmitter;
var Q = require('q');

function TestNode(description, fn) {
  EventEmitter.call(this);

  this.description = description;
  this.fn = fn;
}

TestNode.prototype = Object.create(EventEmitter.prototype);
TestNode.prototype.constructor = TestNode;

TestNode.prototype.hasRun = false;

function verifyCanAssert(node) {
  if (node.hasRun)
    node.emit('error', 'TestNode has already completed ' +
      'execution and cannot emit more assertions. Did you ' +
      'forget a call to `t.cb(...)`?');

  return !node.hasRun;
}

TestNode.prototype.assertOk = function (text) {
  if (verifyCanAssert(this))
    this.emit('assertOk', text);
};

TestNode.prototype.assertNotOk = function (err, info) {
  if (verifyCanAssert(this))
    this.emit('assertNotOk', err, info);
};

TestNode.prototype.run = function (config) {
  var self = this;

  var queuedCallbacks = [];

  function queueCallback(fn) {
    var deferred = Q.defer();
    queuedCallbacks.push(deferred.promise);
    return function () {
      deferred.resolve(fn && Q.fapply(fn, arguments).catch(self.assertNotOk.bind(self)));
    }
  }

  var queuedNodes = [];

  function runQueue() {
    return queuedNodes
      .reduce(function (p, node) {
        return p.then(function () {
          self.emit('childTest', node);
          return node.run(config);
        });
      }, Q.resolve(null));
  }

  var t = config.createTextContext(this);

  t.test = function (description, fn) { queuedNodes.push(new TestNode(description, fn)); };
  t.xtest = function (description) { queuedNodes.push(new SkipTestNode(description)); };
  t.comment = function () { self.emit('comment', arguments); };

  t.cb = queueCallback;

  this.emit('run');
  return Q
    .invoke(this, 'fn', t)
    .catch(self.assertNotOk.bind(self))
    .thenResolve(queuedCallbacks)
    .all()
    .then(function () { self.emit('nodeDone'); })
    .then(runQueue);
};

function SkipTestNode(description) {
  TestNode.call(this, description);
}

SkipTestNode.prototype = Object.create(TestNode.prototype);
SkipTestNode.prototype.constructor = SkipTestNode;

SkipTestNode.prototype.skip = true;

SkipTestNode.prototype.run = function () {
  this.emit('run');
  this.hasRun = true;
  this.emit('nodeDone');
  this.emit('treeDone');
};

module.exports = TestNode;