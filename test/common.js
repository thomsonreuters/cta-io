'use strict';

module.exports = {
  amqp: require('amqplib/callback_api'),
  assert: require('chai').assert,
  sinon: require('sinon'),
  shortid: require('shortid'),
  co: require('co'),
  Io: require('../lib/io'),
  providers: require('../lib/io/providers'),
  IoBrick: require('../lib'),
  json: function() {
    return {
      id: shortid.generate(),
      date: new Date().toISOString(),
    };
  },
};
