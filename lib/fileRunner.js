'use strict';

var Runner = require('./runner')
  , glob = require('glob')
  , path = require('path');

function FileRunner(config, paths) {
  Runner.call(this, config);

  this._fileQueue = [];
  this.paths = Array.isArray(paths) ? paths : [paths];
}

FileRunner.prototype = Object.create(Runner.prototype);
FileRunner.prototype.constructor = FileRunner;

FileRunner.prototype.run = function () {
  if (Runner.current) throw new Error('Another runner is already running.');

  var self = Runner.current = this;

  var done = 0;
  this.paths.forEach(function (globPath) {
    glob(globPath, runFileCallback(self))
      .on('end', function () {
        if (++done === self.paths.length) {
          self._globDone = true;

          if(self._fileQueue.length === 0)
            Runner.prototype._done.call(self);
        }
      });
  });
};

FileRunner.prototype._done = function () {
  if (this._globDone && this._fileQueue.length === 0)
    Runner.prototype._done.call(this);
  else if (this._fileQueue.length > 0) {
    this._queue = this._fileQueue.shift();
    this.emit('file', this._queue.path);
    Runner.prototype.run.call(this, this.config);
  }
};

FileRunner.prototype.enqueue = function () {
  console.error('enqueue improperly called');
};

function runFileCallback(runner) {
  return function (err, filePaths) {
    if (err) console.error(err);
    else if (filePaths.length === 0) runner.emit('done');
    else filePaths
        .map(path.resolve)
        .forEach(function (filePath) {
          var fileQueue = [];
          fileQueue.path = filePath;
          runner._fileQueue.push(fileQueue);
          runner.enqueue = fileQueue.push.bind(fileQueue);

          try {
            require(filePath);
            Runner.prototype.run.call(runner, runner.config);
          } catch (err) {
            runner.emit('error', err);
          } finally {
            delete runner.enqueue;
          }
        });
  };
}

module.exports = FileRunner;