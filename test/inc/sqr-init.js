'use strict';

const assert = require('chai').assert;
const SqrLib = require('../../lib/index.js');

module.exports = function() {
  it('reject if no provider passed', function() {
    try {
      const sqr = new SqrLib();
    } catch (e) {
      assert.equal(e.message, 'Missing provider name');
    }
  });

  it('reject if provider not found', function() {
    try {
      const sqr = new SqrLib('abc');
    } catch (e) {
      assert.equal(e.message, 'Unknown provider "abc"');
    }
  });
};
