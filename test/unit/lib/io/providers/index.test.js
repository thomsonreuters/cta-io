'use strict';

const o = require('../../../../common');

describe('unit: Io Module Providers', function() {
  it('should export all providers', function() {
    o.assert(o.providers);
    o.assert.property(o.providers, 'rabbitmq');
  });
});
