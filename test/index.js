'use strict';

const providers = require('../lib/providers');

const testValidate = require('./inc/validate');
const testSqrValidate = require('./inc/sqr-validate');
const testSqrInit = require('./inc/sqr-init');
const testSqrMain = require('./inc/sqr-main');

describe('validate module', function() {
  testValidate();
});

describe('SQR module instantiation', function() {
  testSqrInit();
});

Object.keys(providers).forEach(function(provider) {
  describe(provider + ' provider validations', function() {
    before(function() {
      this.provider = provider;
    });
    testSqrValidate();
  });
  describe(provider + ' provider main methods', function() {
    before(function() {
      this.provider = provider;
    });
    testSqrMain();
  });
});
