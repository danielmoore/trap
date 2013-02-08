#!/usr/bin/env node

'use strict';

var fs = require('fs')
  , path = require('path')
  , FileRunner = require('../lib/fileRunner')
  , configFactory = require('../lib/config');

var argv = require('optimist')
  .option('c', {
    alias: 'config',
    usage: 'Path to config file.',
    default: path.join(process.cwd(), 'test', configFactory.defaultConfigFileName)
  })
  .argv;

var config = configFactory.load(argv.config);

var runner = new FileRunner(config, argv._.length > 0 ? argv._ : ['./test/{**,}/*.trap.js']);
config.attachReporters(runner);

runner.run();
