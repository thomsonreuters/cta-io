'use strict';

const assert = require('chai').assert;
const Io = require('../lib');
const providers = require('../lib/providers');
const shortid = require('shortid');
const co = require('co');

module.exports = {
  assert: assert,
  shortid: shortid,
  co: co,
  Io: Io,
  providers: providers,
  json: function(){
    return {
      date: new Date().toISOString(),
    };
  }
};
