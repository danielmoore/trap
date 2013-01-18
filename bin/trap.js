#!/usr/bin/env node

'use strict';

var fs = require('fs')
  , path = require('path')
  , FileRunner = require('../lib/fileRunner')
  , config = require('../lib/config');

var argv = require('optimist')
  .option('c', {
    alias: 'config',
    usage: 'Path to config file.',
    default: path.join(process.cwd(), 'test', 'trap.config.js')
  })
  .argv;

if (fs.existsSync(argv.config)) require(argv.config);

var runner = new FileRunner(argv._.length > 0 ? argv._ : ['./test/**/*.trap.js']);
config.attachReporters(runner);

runner.run();
