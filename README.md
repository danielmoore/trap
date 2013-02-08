# trap [![build status](https://secure.travis-ci.org/danielmoore/trap.png)](http://next.travis-ci.org/danielmoore/trap)

trap is simply the most dead-simple test framework you can pick up. It builds and simplifies
the already simple structure of of `node-tap` or `tape`, but is extensible like `mocha`.

Get started with

    npm install trap

![Output Sample][output-sample]

## What do I need to know?

Two things: `test`, and `t.cb`. It's really that simple. You can use the assertion framework
you already know. By default trap uses the standard node assertion library. To run the tests in
single file, just `node` the file.

### `test`

Like tap, we make new test blocks with the `test` function.

```javascript
var test = require('trap').test;

test('This is a test block!', function (t) {
  t.test('This is a child test block!', function (t) {
    // continue to your heart's content.
  });
});
```

### `t.cb`

Unlike tap, you don't need to figure out when your async tests are done runnning, nor
do you need to count how many assertions you have and plan them. Instead, simply register
all of your callbacks with `t.cb`.

```javascript
var test = require('trap').test;

test('Async stuff', function (t) {
  setTimeout(t.cb(function() {
    t.ok(true, 'This is still part of the "Async stuff" test!');
  }), 100);
});
```

#### Promises

If you happen to prefer promises over callbacks, we support that, too! Instead of using
`t.cb()`, perform all of your assertions in a `.then(...)` continuation and return a
promise that encompasses all of the work. Trap will wait for your promise to finish before
running the next test. If your promise fails (e.g. unhandled exception), trap will report
that as an assertion failure.

```javascript
var test = require('trap').test;
var Q = require('q'); // I'm using Q here, but you can use any promise-compliant library.

test('Promise stuff', function(t) {
  var firstFired, secondFired;

  return Q.all([
    Q.delay(100).then(function() {
      firstFired = true;
      t.ok(!secondFired, 'First comes first');
    }),
    Q.delay(150).then(function() {
      secondFired = true;
      t.ok(firstFired, 'Second comes second');
    })
  ]);
});
```

### Assertions

To get the maximum prettiness and documentation of trap, customize
`config.createTextContext` to wrap your favorite assertion library. Otherwise
you can just throw exceptions like you normally do, and those will be interpreted as
assertion failures. Hopefully soon we can get plugins for all the major assertion
libraries so this will be even easier.

## Batch-Running Tests

Trap has a command-line runner so you can run a whole suite of tests together. First, install trap globally:

    npm install -g trap

Then call trap like this:

    node-trap [--config /path/to/config] [path1 [path2 [...]]]

The paths may use glob features supported by [minimatch][]. `--config` defaults to `./test/trap.config.js`
and `path1` defaults to `./test/**/*.trap.js`.

Unfortunately, `trap` is already taken by a bash builtin, so overriding it by default would be a little
presumptuous. But, if you happen to not care about the builtin `trap` function and you really hate typing
`node-`, you can disable the builtin and simultaneously enable `trap` by calling:

    enable -n trap

If you change your mind, you can return to the usual `trap` functionality with:

    enable trap

## Examples

Check out the examples folder.

[minimatch]: https://github.com/isaacs/minimatch
[output-sample]: https://www.evernote.com/shard/s219/sh/fe24811a-5dad-4bce-94c1-360f2a7ad7b6/4674dfbf9231a0b14db31c631243da00/res/ac8f0327-dba1-42ea-830f-9dc9fb6cf6af/skitch.png
