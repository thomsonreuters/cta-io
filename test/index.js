'use strict';

const testAllProviders = require('./inc/all-providers');
const testValidate = require('./inc/validate');
const testSqrInit = require('./inc/sqr-init');

describe('validate module', function() {
  testValidate();
});

describe('SQR module instantiation', function() {
  testSqrInit();
});

['rabbitmq', 'wampkue'].forEach(function(provider) {
  describe(provider + ' provider', function() {
    before(function() {
      this.provider = provider;
    });
    testAllProviders();
  });
});
