'use strict';

var colors = require('colors');
var sprintf = require('util').format;

function onRun() {
  if (this.node.skip) {
    this.state.testsSkipped++;

    this.out({
      format: [ '%s▹ %s', this.indent, this.node.description.underline ],
      colors: [ 'yellow' ]
    });
  } else {
    this.state.testsRun++;

    this.out('%s▸ %s', this.indent, this.node.description.underline);

    if (this.config.profile)
      this.runTime = process.hrTime();
  }
}

function writeTimeFrom(out, from, subject) {
  var diff = process.hrTime(from);
  out({
    format: [ '%s  ◎ %s took %dms %dμs\n', subject, diff[0], diff[1] ],
    colors: [ 'italic', 'grey' ]
  });
}

function onNodeDone() {
  this.out('');

  if (this.config.profile && !this.isEmpty)
    writeTimeFrom(this.out, this.runTime, 'test');
}

function onTreeDone() {
  if (this.config.profile && this.hasChildTests)
    writeTimeFrom(this.out, this.runTime, 'test node and subtree');

  if(this.isEmpty && !this.node.skip)
    this.out({
      format: [ '%s  This test has no content.\n', this.indent ],
      colors: [ 'yellow', 'italic' ]
    });
}

function onChildTest(node) {
  this.isEmpty = false;
  this.hasChildTests = true;
  var writer = new Writer(this.config, this.state, node, this.indentCount + 1);
  writer.listen();
}

function onAssertOk(text) {
  this.isEmpty = false;
  this.state.assertionsRun++;

  this.out({
    format: [ '%s  ✔ %s', this.indent, text || 'ok' ],
    colors: [ 'green' ]
  });
}

function onAssertNotOk(text) {
  this.isEmpty = false;
  this.state.assertionsRun++;
  this.state.assertionsFailed++;

  if (!this.testFailed) {
    this.testFailed = true;
    this.state.testsFailed++;
  }

  this.out({
    format: [ '%s  ✘ %s', this.indent, text || 'not ok' ],
    colors: [ 'red', 'bold' ]
  });
}

function onComment(args) {
  this.out({
    format: ['%s  ✳ %s', this.indent, sprintf.apply(null, args)],
    colors: [ 'grey' ]
  })
}

function getIndent(count) {
  var str = '';
  for (var i = 0; i < count; i++)
    str += '  ';

  return str;
}

function Writer(config, state, node, indentCount) {
  this.config = config || {};

  this.state = state;
  this.node = node;

  this.indentCount = indentCount;
  this.indent = getIndent(indentCount);
}

Writer.prototype.isEmpty = true;

Writer.prototype.listen = function () {
  this.node.once('run', onRun.bind(this));
  this.node.once('nodeDone', onNodeDone.bind(this));
  this.node.once('treeDone', onTreeDone.bind(this));
  this.node.on('childTest', onChildTest.bind(this));
  this.node.on('assertOk', onAssertOk.bind(this));
  this.node.on('assertNotOk', onAssertNotOk.bind(this));
  this.node.on('comment', onComment.bind(this));
};

Writer.prototype.out = function (format) {
  if (arguments.length === 1 && typeof format === 'object') {
    format = arguments[0].format;
    var colors = arguments[0].colors;
  } else if (arguments.length > 1) {
    format = [];
    Array.prototype.push.apply(format, arguments);
  }

  var str = Array.isArray(format) ? sprintf.apply(null, format) : format;

  if (colors && !this.config.noColors)
    str = colors.reduce(function (str, c) { return str[c]; }, str);

  (this.config.out || console.log)(str);
};

module.exports = function (runner, config) {
  var state = {
    testsRun: 0,
    assertionsRun: 0,
    testsFailed: 0,
    assertionsFailed: 0,
    testsSkipped: 0
  };

  var out = config && config.out || console.log;

  runner.on('file', function(filePath){
    out(filePath.cyan);
    out('');
  });

  runner.on('test', function (node) {
    var writer = new Writer(config, state, node, 0);
    writer.listen();
  });

  runner.on('done', function () {
    function numStr(num, str) {
      var format = '%d %s';
      if (num !== 1) format += 's';

      return sprintf(format, num, str);
    }

    var skippedStr = state.testsSkipped ? sprintf('(%s skipped)', numStr(state.testsSkipped, 'test')).yellow : '';

    out('# Summary');
    if (!state.testsFailed && !state.assertionsFailed) {
      var passStr = sprintf(
        '✔ Pass: %s, %s',
        numStr(state.testsRun, 'test'),
        numStr(state.assertionsRun, 'assertion'));

      out('  %s %s', passStr.green, skippedStr);
    } else {
      out(sprintf(
        '  ✘ Fail: %s, %s',
        numStr(state.testsFailed, 'test'),
        numStr(state.assertionsFailed, 'assertion'))
        .red.bold);

      var allRanStr = sprintf(
        '- %s, %s ran.',
        numStr(state.testsRun, 'test'),
        numStr(state.assertionsRun, 'assertion'));

      out('  %s %s', allRanStr.grey, skippedStr);
    }
  });
};