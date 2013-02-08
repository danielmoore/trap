'use strict';

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

  var done = false, pending = 0;

  function queueCallback(fn) {
    pending++;
    return function () {
      if (fn)
        runFn.call(this, fn, arguments);

      if (--pending === 0 && done)
        onNodeDone();
    }
  }

  function runFn(fn, args) {
    try {
      var result = fn.apply(this, args);

      if (result && typeof result.then === 'function' && !config.disablePromises) {
        pending++;

        result.then(function () {
          if (--pending === 0 && done)
            onNodeDone();
        }, function (err) {
          self.assertNotOk(err);

          if (--pending === 0 && done)
            onNodeDone();
        });
      }

    } catch (err) {
      self.assertNotOk(err);
    }
  }

  var queue = [];

  function runQueue() {
    if (queue.length === 0) {
      self.emit('treeDone');
      self.removeAllListeners();
    } else {
      var node = queue.shift();

      node.once('treeDone', runQueue);
      self.emit('childTest', node);
      node.run(config);
    }
  }

  function onNodeDone() {
    self.emit('nodeDone');
    runQueue();
  }

  var t = config.createTextContext(this);

  t.test = function (description, fn) { queue.push(new TestNode(description, fn)); };
  t.xtest = function (description) { queue.push(new SkipTestNode(description)); };
  t.comment = function () { self.emit('comment', arguments); };

  t.cb = queueCallback;

  this.emit('run');
  runFn(this.fn, [t]);

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