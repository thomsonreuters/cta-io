'use strict';

const o = require('../../common');

describe('instantiate io module', function() {
  it('reject if no provider passed', function() {
    try {
      const io = new o.io();
    } catch (e) {
      o.assert.equal(e.message, 'Missing provider name');
    }
  });
  it('reject if provider not found', function() {
    try {
      const io = new o.io('abc');
    } catch (e) {
      o.assert.equal(e.message, 'Unknown provider "abc"');
    }
  });
  it('pass custom options using rabbitmq provider', function() {
    const options = {
      url: 'amqp://my.mq.host',
    };
    const io = new o.io('rabbitmq', options);
    o.assert.equal(io.provider.options, options);
  });
});
