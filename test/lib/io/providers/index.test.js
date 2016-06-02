'use strict';

const o = require('../../../common');

describe('providers', function() {
  it('should export all providers', function() {
    o.assert(o.providers);
    o.assert.property(o.providers, 'rabbitmq');
  });
});
