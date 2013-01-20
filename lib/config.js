var defaultReporter = require('./defaultReporter');

module.exports.createAssertionWrapper = function (ok, notOk) {
  var assert = require('assert');

  var wrapper = {};
  Object.keys(assert).forEach(function (key) {
    if (key === 'AssertionError') return;

    wrapper[key] = function () {
      try {
        assert[key].apply(null, arguments);
        ok(getMessage(key, arguments));
      } catch (err) {
        if (err instanceof assert.AssertionError)
          var errInfo = getErrorInfo(key, arguments);

        notOk(err, errInfo);
      }
    };
  });

  return wrapper;
};

function getMessage(name, args) {
  switch (name) {
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

function getErrorInfo(name, args) {
  switch (name) {
    case 'ok':
    case 'throws':
    case 'doesNotThrow':
    case 'ifError':
      return null;

    default:
      return {
        diff: {
          actual: args[0],
          expected: args[1]
        }
      };
  }
}

module.exports.attachReporters = defaultReporter;