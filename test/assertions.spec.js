'use strict';
var test = require('tape');
var wrapper = require('../lib/config').createAssertionWrapper;

function okWrapper(t) {
  return wrapper(
    function ok() { t.pass('passes'); },
    function notOk() { t.fail('fails'); }
  );
}

function notOkWrapper(t) {
  return wrapper(
    function ok() { t.fail('passes'); },
    function notOk() { t.pass('fails'); }
  );
}

test('custom assertions', function (t) {

  t.test('notOk false', function (t) {
    t.plan(1);
    okWrapper(t).notOk(false, 'false is not ok');
  });  

  t.test('notOk null', function (t) {
    t.plan(1);
    okWrapper(t).notOk(null, 'null is not ok');
  });  

  t.test('notOk undefined', function (t) {
    t.plan(1);
    okWrapper(t).notOk(undefined, 'undefined is not ok');
  });  

  t.test('notOk 0', function (t) {
    t.plan(1);
    okWrapper(t).notOk(0, '0 is not ok');
  });  

  t.test('notOk true', function (t) {
    t.plan(1);
    notOkWrapper(t).notOk(true, 'true is NOT not ok');
  });  

  t.test('notOk {}', function (t) {
    t.plan(1);
    notOkWrapper(t).notOk({}, '{} is NOT not ok');
  });  

  t.test('notOk 1', function (t) {
    t.plan(1);
    notOkWrapper(t).notOk(1, '1 is NOT not ok');
  });  

  t.end();
});
