'use strict';

var test = require('..').test;

function runTests(t, actual) {
  t.equal(actual, 'foo test', 'it compares to strings');
  t.equal(actual, 42, 'it compares to numbers');
  t.equal(actual, { foo: 'bar' }, 'it compares to objects');
}

test('Comparison differences', function (t) {
  t.test('nulls', function (t) {
    runTests(t, null);
  });

  t.test('undefined', function (t) {
    runTests(t, undefined);
  });

  t.test('strings', function (t) {
    runTests(t, 'foo bar');
  });

  t.test('numbers', function (t) {
    runTests(t, 13);
  });

  t.test('objects', function (t) {
    runTests(t, { foo: 'bar', bar: 'foo' });
  });
})