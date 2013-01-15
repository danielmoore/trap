'use strict';

var config = require('./config');
var EventEmitter = require('events').EventEmitter;

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

TestNode.prototype._assertOk = function (args) {
  if (verifyCanAssert(this))
    this.emit('assertOk', args);
};

TestNode.prototype._assertNotOk = function (args) {
  if (verifyCanAssert(this))
    this.emit('assertNotOk', args);
};

TestNode.prototype.run = function () {
  var self = this;
  var queue = [];

  function runQueue() {
    if (queue.length === 0) {
      self.emit('treeDone');
      self.removeAllListeners();
    } else {
      var node = queue.shift();

      node.once('treeDone', runQueue);
      self.emit('childTest', node);
      node.run();
    }
  }

  function onNodeDone() {
    self.emit('nodeDone');
    runQueue();
  }

  var t = config.createAssertionWrapper(this._assertOk.bind(this), this._assertNotOk.bind(this));

  t.test = function (description, fn) { queue.push(new TestNode(description, fn)); };
  t.xtest = function (description) { queue.push(new SkipTestNode(description)); };

  var done = false, pending = 0;

  t.cb = function (fn) {
    pending++;
    return function () {
      if (fn)
        try {
          fn.apply(this, arguments);
        } catch (err) {
          self._assertNotOk(err);
        }

      if (--pending === 0 && done)
        onNodeDone();
    }
  };

  this.emit('run');
  try {
    this.fn(t);
  } catch (err) {
    this._assertNotOk(err);
  }

  done = true;
  if (pending === 0)
    onNodeDone();
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