'use strict';

const o = require('../../../common');

describe('rabbitmq provider', function() {
  it('should set default params', function() {
    const provider = new o.providers.rabbitmq();
    o.assert(provider.options, {
      url: 'amqp://localhost?heartbeat=60',
    });
  });

  it('should set custom params', function() {
    const provider = new o.providers.rabbitmq({url: 'amqp://mydomain.com'});
    o.assert(provider.options, {
      url: 'amqp://mydomain.com',
    });
  });

  it('should connect when there is no connection', function(done) {
    const connect = o.sinon.spy(o.amqp, 'connect');
    const provider = new o.providers.rabbitmq();
    o.assert(!provider.channel);
    provider.connect()
      .then(function() {
        connect.restore();
        o.sinon.assert.calledOnce(connect);
        o.assert(provider.connection);
        done();
      })
      .catch(function(err) {
        console.error(err);
        done('error');
      });
  });

  it('should not connect when there is already a connection', function(done) {
    const connect = o.sinon.spy(o.amqp, 'connect');
    const provider = new o.providers.rabbitmq();
    o.assert(!provider.channel);
    provider.connect()
      .then(function() {
        provider.connect()
          .then(function() {
            connect.restore();
            o.sinon.assert.callCount(connect, 1);
            done();
          })
          .catch(function(err) {
            console.error(err);
            done('error');
          });
      })
      .catch(function(err) {
        console.error(err);
        done('error');
      });
  });

  it('should reconnect on disconnection', function(done) {
    this.timeout(10000);
    const provider = new o.providers.rabbitmq();
    provider.reconnectAfter = 100;
    provider.on('reconnected', done);
    provider.connect()
    .then(function() {
      provider.connection.emit('close');
    })
    .catch(function(err) {
      console.error(err);
      done('error');
    });
  });

  it('healthCheck', function(done) {
    const provider = new o.providers.rabbitmq();
    o.assert.strictEqual(provider.healthCheck(), false);
    provider.connect()
      .then(function() {
        o.assert.strictEqual(provider.healthCheck(), true);
        done();
      })
      .catch(function(err) {
        console.error(err);
        done('error');
      });
  });
});
