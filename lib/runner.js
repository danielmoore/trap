'use strict';

var EventEmitter = require('events').EventEmitter;

function Runner() {
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

Runner.prototype.run = function run() {
  if (this._currentTest) return;

  var self = this;

  if (this._queue.length === 0)
    this._done();
  else {
    var node = this._queue.shift();
    this.emit('test', node);

    node.once('treeDone', function () {
      self._currentTest = null;
      run.call(self)
    });

    this._countErrors(node);

    this._currentTest = node;
    node.run();
  }
};

Runner.prototype.enqueue = function (node) {
  this._queue.push(node);
};

Runner.prototype._done = function () {
  this.emit('done');

  process.exit(this.errorCount);
};

module.exports = Runner;