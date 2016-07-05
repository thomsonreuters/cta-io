'use strict';

const o = require('../../../../../common');

describe('unit: rabbitmq provider common tests', function() {
  it('should set default params', function() {
    const defaults = require('../../../../../../lib/io/providers/rabbitmq/config.defaults');
    const provider = new o.RmqProvider();
    o.assert.strictEqual(provider.config.url, defaults.url);
    o.assert.strictEqual(provider.config.reConnectAfter, defaults.reConnectAfter);
    o.assert.strictEqual(provider.config.reChannelAfter, defaults.reChannelAfter);
    o.assert.strictEqual(provider.config.clearInterval, defaults.clearInterval);
    o.assert.strictEqual(provider.config.clearOffset, defaults.clearOffset);
  });

  it('should set custom params', function() {
    const config = {
      url: 'amqp://mydomain.com',
      reConnectAfter: 10 * 1000,
      reChannelAfter: 10 * 1000,
      clearInterval: 60 * 60 * 1000,
      clearOffset: 2 * 60 * 60 * 1000,
      newInstance: true,
    };
    const provider = new o.RmqProvider(config);
    o.assert.strictEqual(provider.config.url, config.url);
    o.assert.strictEqual(provider.config.reConnectAfter, config.reConnectAfter);
    o.assert.strictEqual(provider.config.reChannelAfter, config.reChannelAfter);
    o.assert.strictEqual(provider.config.clearInterval, config.clearInterval);
    o.assert.strictEqual(provider.config.clearOffset, config.clearOffset);
  });

  it('processMsg', function() {
    const provider = new o.RmqProvider({newInstance: true});
    let msg = {
      content: new Buffer(JSON.stringify({foo: 'bar'})),
    };
    let json = provider._processMsg(msg, true);
    o.assert.property(json, 'id');
    o.assert.property(provider.messages, json.id);
    o.assert.property(provider.messages[json.id], 'msg');
    o.assert.property(provider.messages[json.id], 'timestamp');
    msg = {
      content: new Buffer(JSON.stringify({id: 'def'})),
    };
    json = provider._processMsg(msg);
    o.assert.property(json, 'id');
    o.assert.notProperty(provider.messages, json.id);
  });

  it('should connect when there is no connection', function(done) {
    const connect = o.sinon.spy(o.amqp, 'connect');
    const provider = new o.RmqProvider({newInstance: true});
    o.assert(!provider.connection);
    provider._connect(false)
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
    const provider = new o.RmqProvider({newInstance: true});
    o.assert(!provider.channel);
    provider._connect()
      .then(function() {
        provider._connect()
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
    const provider = new o.RmqProvider({newInstance: true});
    const connect = o.sinon.spy(provider, '_connect');
    const _reconnectConsumers = o.sinon.spy(provider, '_reconnectConsumers');
    const clock = o.sinon.useFakeTimers();
    provider._connect(true)
      .then(function() {
        o.assert(provider.connection);
        provider.connection.emit('close');
        clock.tick(provider.config.reConnectAfter);
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
    const provider = new o.RmqProvider({newInstance: true});
    o.assert.strictEqual(provider.healthCheck(), false);
    provider._init()
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
      const provider = new o.RmqProvider({newInstance: true});
      yield provider._init();
      const ack = o.sinon.stub(provider.channel, 'ack');
      provider.messages.abc = {
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
      const provider = new o.RmqProvider({newInstance: true});
      yield provider._init();
      const nack = o.sinon.stub(provider.channel, 'nack');
      provider.messages.abc = {
        msg: {a: 1},
      };
      yield provider.nack({id: 'abc'});
      o.sinon.assert.calledWith(nack, {a: 1});
      done();
    })
    .catch((err) => {
      done(err);
    });
  });

  it('houseKeeping', function(done) {
    const provider = new o.RmqProvider({newInstance: true, clearInterval: 100});
    const now = Date.now();
    provider.messages = {
      a: {
        msg: {},
        timestamp: now - provider.config.clearOffset,
      },
      b: {
        msg: {},
        timestamp: now,
      },
    };
    provider._houseKeeping();
    setTimeout(function() {
      o.assert.sameMembers(Object.keys(provider.messages), ['b']);
      done();
    }, provider.config.clearInterval);
  });

  it('should return queue information', function(done) {
    return o.co(function* coroutine() {
      const provider = new o.RmqProvider({newInstance: true});
      yield provider._init();
      const assertQueue = o.sinon.spy(provider.channel, 'assertQueue');
      const queue = o.shortid.generate();
      yield provider.info(queue);
      o.sinon.assert.calledOnce(assertQueue);
      done();
    })
    .catch((err) => {
      done(err);
    });
  });

  it('should cancel a consumer', function(done) {
    return o.co(function* coroutine() {
      const provider = new o.RmqProvider({newInstance: true});
      yield provider._init();
      const cancel = o.sinon.spy(provider.channel, 'cancel');
      yield provider.cancel('abc');
      o.sinon.assert.calledOnce(cancel);
      done();
    })
    .catch((err) => {
      done(err);
    });
  });
});
