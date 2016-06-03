'use strict';

const assert = require('chai').assert;
const sinon = require('sinon');
const Io = require('../lib/io');
const providers = require('../lib/io/providers');
const shortid = require('shortid');
const co = require('co');

module.exports = {
  amqp: require('amqplib/callback_api'),
  assert: assert,
  sinon: sinon,
  shortid: shortid,
  co: co,
  Io: Io,
  providers: providers,
  IoBrick: require('../lib'),
  json: function() {
    return {
      date: new Date().toISOString(),
    };
  },
};
