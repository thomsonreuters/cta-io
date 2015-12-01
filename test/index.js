"use strict";

const Sqr = require('../lib/index.js');
const tests = require('./tests.js');
const main = [{
  provider: 'rabbitMQProvider'
}, {
  provider: 'wampKueProvider'
}];

main.forEach(function (e) {
  describe(e.provider, function () {
    before(function () {
      this.provider = new Sqr[e.provider]();
      this.id = e.provider;
    });
    tests();
  });
});