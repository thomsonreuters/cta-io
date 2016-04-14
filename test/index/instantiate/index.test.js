'use strict';

const o = require('../../common');

describe('index -> instantiate', function() {
  it('reject if no provider passed', function() {
    try {
      const io = new o.Io();
    } catch (e) {
      o.assert.equal(e.message, 'Missing provider name');
    }
  });
  it('reject if provider not found', function() {
    try {
      const io = new o.Io('abc');
    } catch (e) {
      o.assert.equal(e.message, 'Unknown provider "abc"');
    }
  });
  it('pass custom options using rabbitmq provider', function() {
    const options = {
      url: 'amqp://my.mq.host',
    };
    const io = new o.Io('rabbitmq', options);
    o.assert.equal(io.provider.options, options);
  });
});
