'use strict';

var colors = require('ansicolors');
var styles = require('ansistyles');
var sprintf = require('util').format;
var objDiff = require('difflet')({ indent: 2, comment: true });
var strDiff = require('./stringDiff');

function onRun() {
  if (this.node.skip) {
    this.state.testsSkipped++;

    this.out({
      format: [ '%s▹ %s', this.indent, styles.underline(this.node.description) ],
      color: 'yellow'
    });
  } else {
    this.state.testsRun++;

    this.out('%s▸ %s', this.indent, styles.underline(this.node.description));

    if (this.config.profile)
      this.runTime = process.hrTime();
  }
}

function writeTimeFrom(out, from, subject) {
  var diff = process.hrTime(from);
  out({
    format: [ '%s◎ %s took %dms %dμs\n', this.childIndent, subject, diff[0], diff[1] ],
    color: 'brightBlack',
    styles: [ 'italic' ]
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

  if (this.isEmpty && !this.node.skip)
    this.out({
      format: [ '%sThis test has no content.\n', this.indent1 ],
      color: 'yellow',
      styles: [ 'italic' ]
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
    format: [ '%s✔ %s', this.indent1, text || 'ok' ],
    color: 'green'
  });
}

function isObject(obj) { return obj === Object(obj); }
function isString(obj) { return Object.prototype.toString.call(obj) === '[object String]' }

function onAssertNotOk(err, info) {
  this.isEmpty = false;
  this.state.assertionsRun++;
  this.state.assertionsFailed++;

  if (!this.testFailed) {
    this.testFailed = true;
    this.state.testsFailed++;
  }

  this.out({
    format: [ '%s✘ %s', this.indent1, err.message || err || 'not ok'],
    color: 'brightRed'
  });

  if (err.stack) {
    this.out({
      format: [ '%sStack Trace:', this.indent2 ],
      color: 'magenta'
    });

    this.out({
      format: indentLines(err.stack, this.indent3),
      color: 'red'
    });
  }

  if (info && info.diff) {
    printObj(this, 'Actual', info.diff.actual);
    printObj(this, 'Expected', info.diff.expected);

    if (isString(info.diff.actual) && isString(info.diff.expected))
      printDiff(this, strDiff(info.diff.actual, info.diff.expected));
    else if (isObject(info.diff.actual) && isObject(info.diff.expected))
      printDiff(this, objDiff.compare(info.diff.expected, info.diff.actual));
  }
}

function printObj(writer, header, obj) {
  printStr(writer, header, JSON.stringify(obj, null, 2));
}

function printStr(writer, header, str) {
  writer.out(
    '%s%s%s',
    writer.indent2,
    colors.magenta(header + ': '),
    indentLines(str, writer.indent2, false));
}

function printDiff(writer, diff) {
  printStr(writer, 'Diff', diff);
}

function indentLines(str, indent, indentFirst) {
  if(indentFirst === undefined) indentFirst = true;
  return sprintf('%s%s\n', indentFirst ? indent : '', str.replace(/\n/g, '\n' + indent));
}

function onComment(args) {
  this.out({
    format: ['%s✳ %s', this.indent1, sprintf.apply(null, args)],
    color: 'brightBlack'
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
  this.indent1 = getIndent(indentCount + 1);
  this.indent2 = getIndent(indentCount + 2);
  this.indent3 = getIndent(indentCount + 3);
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
    var applyColor = arguments[0].color;
    var applyStyles = arguments[0].styles;
  } else if (arguments.length > 1) {
    format = [];
    Array.prototype.push.apply(format, arguments);
  }

  var str = Array.isArray(format) ? sprintf.apply(null, format) : format;

  if (!this.config.noAnsi) {
    if (applyColor)
      str = colors[applyColor](str);

    if (applyStyles)
      str = applyStyles.reduce(function (str, s) { return styles[s](str); }, str);
  }

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

  runner.on('file', function (filePath) {
    out(colors.cyan(filePath));
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

    var skippedStr = state.testsSkipped ? colors.yellow(sprintf('(%s skipped)', numStr(state.testsSkipped, 'test'))) : '';

    out('# Summary');
    if (!state.testsFailed && !state.assertionsFailed) {
      var passStr = sprintf(
        '✔ Pass: %s, %s',
        numStr(state.testsRun, 'test'),
        numStr(state.assertionsRun, 'assertion'));

      out('  %s %s', colors.green(passStr), skippedStr);
    } else {
      out(colors.brightRed(sprintf(
        '  ✘ Fail: %s, %s',
        numStr(state.testsFailed, 'test'),
        numStr(state.assertionsFailed, 'assertion'))));

      var allRanStr = sprintf(
        '- %s, %s ran.',
        numStr(state.testsRun, 'test'),
        numStr(state.assertionsRun, 'assertion'));

      out('  %s %s', colors.brightBlack(allRanStr), skippedStr);
    }
  });
};
