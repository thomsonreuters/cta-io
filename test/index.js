'use strict';

const SqrLib = require('../lib/index.js');
const tests = require('./tests.js');
const main = [{
  provider: 'rabbitMQProvider',
  params: {
    uri: 'amqp://localhost',
  },
}, {
  provider: 'wampKueProvider',
  params: {},
}];

main.forEach(function(e) {
  describe(e.provider, function() {
    before(function() {
      this.provider = new SqrLib[e.provider](e.params);
      this.id = e.provider;
    });
    tests();
  });
});
