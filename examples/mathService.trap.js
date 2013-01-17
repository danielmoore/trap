var test = require('..').test;

function MathService() {
  this.add = function (a, b) { return a + b; };

  this.brokenAdd = function () { return -1; };

  this.addAsync = function (a, b, callback) {
    setTimeout(function () { callback(a + b); }, 100);
  };
}

test('synchronous math service', function (t) {
  var sut = new MathService();

  t.test('it can add', function (t) {
    t.equal(sut.add(2, 3), 5, '2 + 3 = 5');
    t.equal(sut.add(4, 5), 9, '4 + 5 = 9');
  });

  t.test('it has a broken add', function (t) {
    t.equal(sut.brokenAdd(2, -3), -1, '2 + (-3) = -1');
    t.equal(sut.brokenAdd(3, 4), 7, '3 + 4 = 7');
  });

  t.xtest('it has a skipped test', function (t) {
    t.equal(sut.add(2, 3), 5, '2 + 3 = 5');
    t.equal(sut.add(4, 5), 9, '4 + 5 = 9');
  });
});

test('asynchronous math service', function (t) {
  var sut = new MathService();

  t.test('it can add simultaneously', function (t) {
    sut.addAsync(2, 3, t.cb(function (result) {
      t.equal(result, 5, '2 + 3 = 5');
    }));

    sut.addAsync(4, 5, t.cb(function (result) {
      t.equal(result, 9, '4 + 5 = 9');
    }))
  });

  t.test('it can add with multiple async calls', function (t) {
    sut.addAsync(2, 3, t.cb(function (result) {
      t.equal(result, 5, '2 + 3 = 5');

      sut.addAsync(result, 5, t.cb(function (result) {
        t.equal(result, 10, '2 + 3 + 5 = 10');

        t.comment('This is a comment!');

        sut.addAsync(result, 3, t.cb(function (result) {
          t.equal(result, 13, '2 + 3 + 5 + 3 = 13');
        }));

        sut.addAsync(result, 9, t.cb(function (result) {
          t.equal(result, 19, '2 + 3 + 5 + 9 = 19');
        }));
      }));
    }));
  });
});

test('An empty test', function () {});