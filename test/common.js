'use strict';

const shortid = require('shortid');

module.exports = {
  Messaging: require('cta-messaging'),
  assert: require('chai').assert,
  sinon: require('sinon'),
  shortid: shortid,
  co: require('co'),
  sleep: require('co-sleep'),
  Lib: require('../lib'),
  json: function() {
    return {
      id: shortid.generate(),
      date: new Date().toISOString(),
    };
  },
};
