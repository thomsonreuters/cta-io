'use strict';

const assert = require('chai').assert;
const io = require('../lib');
const providers = require('../lib/providers');
const shortid = require('shortid');

module.exports = {
  assert: assert,
  shortid: shortid,
  io: io,
  providers: providers,
};
