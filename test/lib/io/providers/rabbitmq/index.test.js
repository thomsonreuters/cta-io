'use strict';

const o = require('../../../../common');

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
    const provider = new o.providers.rabbitmq();
    const _reconnect = o.sinon.spy(provider, '_reconnect');
    const connect = o.sinon.spy(provider, 'connect');
    const _reconnectConsumers = o.sinon.spy(provider, '_reconnectConsumers');
    const clock = o.sinon.useFakeTimers();
    provider.connect()
      .then(function() {
        provider.connection.emit('close');
        clock.tick(provider.reconnectAfter);
        _reconnect.restore();
        o.sinon.assert.called(_reconnect);
        connect.restore();
        o.sinon.assert.callCount(connect, 2);
        clock.restore();
        setTimeout(function() {
          _reconnectConsumers.restore();
          o.sinon.assert.calledOnce(_reconnectConsumers);
          done();
        }, 500);
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

  it('ack', function(done) {
    return o.co(function* coroutine() {
      const provider = new o.providers.rabbitmq();
      yield provider.connect();
      const ack = o.sinon.stub(provider.channel, 'ack');
      provider.msg.abc = {
        msg: {a: 1},
      };
      yield provider.ack('abc');
      o.sinon.assert.calledWith(ack, {a: 1});
      done();
    })
    .catch((err) => {
      done(err);
    });
  });

  it('nack', function(done) {
    return o.co(function* coroutine() {
      const provider = new o.providers.rabbitmq();
      yield provider.connect();
      const nack = o.sinon.stub(provider.channel, 'nack');
      provider.msg.abc = {
        msg: {a: 1},
      };
      yield provider.nack('abc');
      o.sinon.assert.calledWith(nack, {a: 1});
      done();
    })
    .catch((err) => {
      done(err);
    });
  });
});
