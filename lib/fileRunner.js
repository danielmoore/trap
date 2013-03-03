'use strict';

var Runner = require('./runner')
  , glob = require('glob')
  , path = require('path')
  , Q = require('q')
  , PromiseQueue = require('./util/promiseQueue');

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

  var queue = new PromiseQueue();

  this.paths.forEach(function (globPath) {
    glob(globPath, enqueueFiles(self, queue))
      .on('end', queue.done.bind(queue));
  });

  queue.promise.done(function(){
    self.emit('done');
    process.exit(self.errorCount);
  });
};


FileRunner.prototype.enqueue = function () {
  console.error('enqueue improperly called');
};

function enqueueFiles(runner, queue) {
  return function (err, filePaths) {
    if (err) queue.enqueue(function () { throw err; });
    else if (filePaths.length === 0) runner.emit('done');
    else filePaths
        .forEach(function (filePath) {
          queue.enqueue(function () {
            var fileQueue = [];
            runner.enqueue = fileQueue.push.bind(fileQueue);

            try {
              var resolvedPath = path.resolve(filePath);
              runner.emit('file', resolvedPath);
              require(resolvedPath);
            } catch (err) {
              runner.emit('error', err);
            } finally {
              delete runner.enqueue;
            }

            return Q.fcall(Runner.run, runner, fileQueue);
          });
        });
  };
}

module.exports = FileRunner;