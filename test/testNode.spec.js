var test = require('tape');
var proxyquire = require('proxyquire').noCallThru();

var ok, notOk;

var wrapper = { foo: {}, bar: {} };

var stubs = {
  './config': {
    createAssertionWrapper: function () {
      ok = arguments[0];
      notOk = arguments[1];
      return wrapper;
    }
  }
};

var TestNode = proxyquire('../lib/testNode', stubs);

test('TestNode', function (t) {
  t.test('runs simple tests', function (t) {
    t.plan(9);
    var events = [];

    var nodeDone, subtest1Done, treeDone;
    var sut = new TestNode('foobar', function (ctx) {
      t.deepEquals(events, [{ event: 'run', args: undefined }], 'emits the `run` event');
      t.equal(wrapper.foo, ctx.foo, 'it passes the wrapper `foo`');
      t.equal(wrapper.bar, ctx.bar, 'it passes the wrapper `bar`');

      ctx.test('subtest', function(ctx) {
        t.ok(nodeDone, 'it calls subtests after the node is done.');
        t.notOk(treeDone, 'it does not emit treeDone');
        subtest1Done = true;
      });

      ctx.test('subtest 2', function(ctx) {
        t.ok(subtest1Done, 'it runs substests in order.');
        treeDone = true;
      });

      nodeDone = true;
    });

    sut.emit = function(event, args) {
      events.push({ event: event, args: args });

      switch(event) {
        case 'nodeDone':
          t.ok(nodeDone, 'it emits nodeDone');
          t.notOk(treeDone, 'it does not emit treeDone');
          break;

        case 'treeDone':
          t.ok(treeDone, 'it emits treeDone');
          break;
      }
    };

    sut.run();
  });

  t.end();
});