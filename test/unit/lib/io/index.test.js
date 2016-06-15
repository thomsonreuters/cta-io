'use strict';

const o = require('../../../common');

describe('unit: Io Module Constructor', function() {
  it('reject if no provider passed', function() {
    try {
      const io = new o.Io();
    } catch (e) {
      o.assert.equal(e.message, 'Missing provider name');
    }
  });
  it('reject if unknown provider', function() {
    try {
      const io = new o.Io('abc');
    } catch (e) {
      o.assert.equal(e.message, 'Unknown provider "abc"');
    }
  });
});
