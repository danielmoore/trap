'use strict';

var configFactory = require('./lib/config')
  , TestNode = require('./lib/testNode')
  , path = require('path')
  , fs = require('fs')
  , existsSync = fs.existsSync || path.existsSync;

var Runner = require('./lib/runner');

function findConfigPath() {
  var dir = path.dirname(module.parent.filename);
  do {
    var configPath = path.join(dir, 'trap.config.js');

    if (existsSync(configPath))
      return configPath;

    var parent = path.dirname(dir);
  } while (parent !== dir && (dir = parent));

  return null;
}

function getRunner() {
  if (!Runner.current) {
    var config = configFactory.load(findConfigPath());
    var runner = Runner.current = new Runner(config);
    config.attachReporters(runner);

    process.nextTick(function () {
      runner.run();
    });
  }

  return Runner.current;
}

module.exports = {
  test: function (description, fn) {
    getRunner().enqueue(new TestNode(description, fn));
  },
  defaultConfig: require('./lib/defaultConfig'),
  core: {
    Runner: Runner,
    FileRunner: require('./lib/fileRunner'),
    TestNode: TestNode,
    defaultReporter: require('./lib/defaultReporter'),
    defaultConig: require('./lib/defaultConfig')
  }
};