'use strict';

var Q = require('q');

module.exports = PromiseQueue;

function PromiseQueue() {
  this._queue = [];
  this._deferred = Q.defer();
  this.promise = this._deferred.promise;
}

PromiseQueue.prototype.enqueue = function (promiseFn) {
  if (this._done) throw new Error('Cannot enqueue after doen() has been called');

  if (!Q.isRejected(this.promise)) {
    this._queue.push(promiseFn);

    if (this._queue.length === 1)
      this._runOne();
  }
};

PromiseQueue.prototype._runOne = function () {
  var self = this;
  Q
    .fcall(this._queue[0])
    .finally(function () { self._queue.shift(); })
    .done(function () {
      if (self._queue.length)
        self._runOne();
      else if (self._done)
        self._deferred.resolve();
    }, this._deferred.reject.bind(this._deferred));
};

PromiseQueue.prototype.done = function () {
  this._done = true;
  if (!this._queue.length)
    this._deferred.resolve();
};