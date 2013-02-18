#!/usr/bin/env node

'use strict';

var fs = require('fs')
  , path = require('path')
  , FileRunner = require('../lib/fileRunner')
  , configFactory = require('../lib/config')
  , existsSync = fs.existsSync || path.existsSync;

var argv = require('optimist')
  .option('c', {
    alias: 'config',
    usage: 'Path to config file.',
    default: path.join(process.cwd(), 'test', configFactory.defaultConfigFileName)
  })
  .option('e', {
    alias: 'extension',
    usage: 'The extension of test files to look for when using simple paths.',
    default: '.trap.js',
    check: function (ext) {
      if (ext.length < 1 || ext[0] != '.')
        throw new Error('extension must start with a "."');
    }
  })
  .argv;

var config = configFactory.load(argv.config);

var runner = new FileRunner(
  config, argv._.length > 0
    ? argv._.map(resolveTestPath)
    : ['./test/{**,}/*' + argv.extension ]);

config.attachReporters(runner);

runner.run();

function resolveTestPath(testPath) {
  return existsSync(testPath) && fs.statSync(testPath).isDirectory()
    ? path.join(testPath, '{**,}', '*' + argv.extension)
    : testPath;
}
