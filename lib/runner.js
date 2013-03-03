'use strict';

var EventEmitter = require('events').EventEmitter;
var Q = require('q');

function Runner(config) {
  this.config = config;
  this._queue = [];
}

Runner.prototype = Object.create(EventEmitter.prototype);
Runner.prototype.constructor = Runner;

Runner.prototype.errorCount = 0;

Runner.prototype._countErrors = function _countErrors(node) {
  var self = this;
  node.on('assertNotOk', function () { self.errorCount++; });
  node.on('childTest', _countErrors.bind(this));
};

Runner.prototype._trackCurrentTest = function (node) {
  var self = this;

  node.on('childTest', function (child) {
    self.currentTest = child;

    child.on('treeDone', function () {
      self.currentTest = node;
    });

    self._trackCurrentTest(child);
  });
};

Runner.run = function (runner, queue) {
  function runNode(node) {
    runner.emit('test', node);

    node.once('treeDone', function () {
      runner.currentTest = null;
    });

    runner._trackCurrentTest(node);
    runner._countErrors(node);

    runner.currentTest = node;
    return node.run(runner.config);
  }

  return queue.reduce(function (p, node) {
    return p ? p.then(Q.fbind(runNode, node)) : Q.fcall(runNode, node);
  }, null);
};

Runner.prototype.run = function () {
  var self = this;

  var queue = this._queue;
  this._queue = [];

  return Runner.run(this, queue)
    .done(function () {
      self.emit('done');
      process.exit(self.errorCount);
    });
};

Runner.prototype.enqueue = function (node) {
  this._queue.push(node);
};

module.exports = Runner;