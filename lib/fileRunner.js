'use strict';

var Runner = require('./runner');
var glob = require('glob');

function FileRunner(paths) {
  Runner.call(this);

  this.paths = Array.isArray(paths) ? paths : [paths];
}

FileRunner.prototype = Object.create(Runner.prototype);
FileRunner.prototype.constructor = FileRunner;

FileRunner.prototype.run = function () {
  if (Runner.current) throw new Error('Another runner is already running.');

  Runner.current = this;

  var done = 0;
  this.paths.forEach(function (globPath) {
    glob(globPath, runFileCallback(this))
      .on('end', function () {
        if (++done === this.paths.length)
           this._globDone = true;
      }.bind(this));
  });
};

FileRunner.prototype._done = function () {
  if (this._globDone)
    Runner.prototype._done.call(this);
};

function runFileCallback(runner) {
  return function (filePaths) {
    filePaths.forEach(function (filePath) {
      try {
        require(filePath);
        runner.run();
      } catch (err) {
        runner.emit('error', err);
      }
    });
  };
}

module.exports = FileRunner;