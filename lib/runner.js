'use strict';

var EventEmitter = require('events').EventEmitter;

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

  node.on('childTest', function(child){
    self.currentTest = child;

    child.on('treeDone', function(){
      self.currentTest = node;
    });

    self._trackCurrentTest(child);
  });
};

Runner.prototype.run = function run() {
  if (this.currentTest) return;

  var self = this;

  if (this._queue.length === 0)
    this._done();
  else {
    var node = this._queue.shift();
    this.emit('test', node);

    node.once('treeDone', function () {
      self.currentTest = null;
      run.call(self)
    });

    this._trackCurrentTest(node);
    this._countErrors(node);

    this.currentTest = node;
    node.run(this.config);
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