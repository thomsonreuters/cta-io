'use strict';

const assert = require('chai').assert;
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

describe('Instantiation', function() {
  it('reject if no provider passed', function() {
    try {
      const sqr = new SqrLib();
    } catch(e) {
      assert.equal(e.message, 'Missing provider');
    }
  });

  it('reject if passed wrong provider type', function() {
    try {
      const sqr = new SqrLib('abc');
    } catch(e) {
      assert.equal(e.message, 'Missing provider');
    }
  });
});

main.forEach(function(e) {
  describe(e.provider, function() {
    before(function() {
      this.provider = new SqrLib[e.provider](e.params);
      this.id = e.provider;
    });
    tests();
  });
});
