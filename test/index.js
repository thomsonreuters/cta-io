'use strict';

const SqrLib = require('../lib/index.js');
const tests = require('./tests.js');
const main = [{
  provider: 'rabbitMQProvider',
  params: {
    url: 'amqp://localhost',
  },
}, {
  provider: 'wampKueProvider',
  params: {
    url: 'ws://127.0.0.1:8080/ws',
    realm: 'realm1',
  },
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
