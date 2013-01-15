'use strict';

var test = require('..').test;
var tick = process.nextTick;

test('1', function (t) {
  tick(t.cb(function () {
    t.test('1.1', function (t) {
      t.ok(true, '1.1 - A')
    });

    t.ok(true, '1 - A');
  }));
});

test('2', function (t) {
  t.test('2.1', function (t) {
    tick(t.cb(function () {
      t.test('2.1.1', function (t) {
        t.ok(true, '2.1.1 - A');
      });

      thisMethodDoesNotExist();
    }));
  });

  tick(t.cb(function () {
    throw new Error('2 - B');
  }));

  throw new Error('2 - A');
});