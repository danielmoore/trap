'use strict';

var defaultReporter = require('./defaultReporter');

module.exports.createAssertionWrapper = function (ok, notOk) {
  var assert = require('assert');
  var customAssertions = require('./customAssertions');

  var wrapper = {};

  function wrap(assertions) {
    Object.keys(assertions).forEach(function (key) {
      if (key === 'AssertionError') return;

      wrapper[key] = function () {
        try {
          assertions[key].apply(null, arguments);
          ok(getMessage(key, arguments));
        } catch (err) {
          notOk(err);
        }
      };
    });
  }

  wrap(assert);
  wrap(customAssertions);

  return wrapper;
};

function getMessage(name, args) {
  switch(name) {
    case 'ok':
    case 'ifError':
      return args[1];

    case 'throws':
    case 'doesNotThrow':
      return args[2] || (typeof args[1] === 'string' && args[1]);

    default:
      return args[2];
  }
}


module.exports.attachReporters = defaultReporter;
