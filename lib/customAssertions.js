'use strict';

var assert = require('assert');

function fail(actual, expected, message, operator, stackStartFunction) {
  throw new assert.AssertionError({
    message: message,
    actual: actual,
    expected: expected,
    operator: operator,
    stackStartFunction: stackStartFunction
  });
}

function notOk(value, message) {
  if (!!value) fail(value, false, message, '!=', notOk);
}

module.exports = {
  notOk: notOk
};
