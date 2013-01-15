var config = require('./lib/config');
var TestNode = require('./lib/testNode');

var Runner = require('./lib/runner');

function getRunner() {
  if (!Runner.current) {
    var runner = Runner.current = new Runner();
    config.attachReporters(runner);

    process.nextTick(function () {
      runner.run();
    });
  }

  return Runner.current;
}

module.exports = {
  test: function (description, fn) {
    getRunner().enqueue(new TestNode(description, fn));
  },
  config: config,
  core: {
    TestNode: TestNode
  }
};