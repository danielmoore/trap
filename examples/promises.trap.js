'use strict';

var test = require('..').test;

// I'm using Q here, but you can use any Promises/A-compliant library.
// http://promises-aplus.github.com/promises-spec/
var Q = require('q');

test('Promise stuff', function (t) {
  var firstFired, secondFired;

  return Q.all([
    Q.delay(100).then(function () {
      firstFired = true;
      t.ok(!secondFired, 'First comes first');
    }),
    Q.delay(150).then(function () {
      secondFired = true;
      t.ok(firstFired, 'Second comes second');
    })
  ]);
});

test('Broken promises', function (t) {
  return Q.fcall(function () {
    throw new Error('lies');
  });
});
