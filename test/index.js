'use strict';

const assert = require('chai').assert;
const SqrLib = require('../lib/index.js');
const tests = require('./tests.js');

describe('Instantiation', function() {
  it('reject if no provider passed', function() {
    try {
      const sqr = new SqrLib();
    } catch(e) {
      assert.equal(e.message, 'Missing provider');
    }
  });

  it('reject if provider not found', function() {
    try {
      const sqr = new SqrLib('abc');
    } catch(e) {
      assert.equal(e.message, 'Provider "abc" not found');
    }
  });
});

['rabbitmq', 'wampkue'].forEach(function(provider) {
  describe(provider, function() {
    before(function() {
      this.provider = provider;
    });
    tests();
  });
});
