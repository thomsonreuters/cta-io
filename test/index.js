'use strict';

const sqrLib = require('../lib/index.js');
const tests = require('./tests.js');
const main = [{
  provider: 'rabbitMQProvider',
}, {
  provider: 'wampKueProvider',
}];

main.forEach(function mainFct(e) {
  describe(e.provider, function describeFct() {
    before(function beforeFct() {
      this.provider = new sqrLib[e.provider]();
      this.id = e.provider;
    });
    tests();
  });
});
