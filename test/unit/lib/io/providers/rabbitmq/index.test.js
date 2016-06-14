'use strict';

const o = require('../../../../../common');

describe('rabbitmq provider common tests', function() {
  it('should set default params', function() {
    const defaults = require('../../../../../../lib/io/providers/rabbitmq/config.defaults');
    const provider = new o.RmqProvider();
    o.assert.deepEqual(provider.config, {
      url: defaults.url,
      reconnectAfter: defaults.reconnectAfter,
      clearInterval: defaults.clearInterval,
      clearOffset: defaults.clearOffset,
      newInstance: false,
    });
  });

  it('should set custom params', function() {
    const config = {
      url: 'amqp://mydomain.com',
      reconnectAfter: 10 * 1000,
      clearInterval: 60 * 60 * 1000,
      clearOffset: 2 * 60 * 60 * 1000,
      newInstance: true,
    };
    const provider = new o.RmqProvider(config);
    o.assert.deepEqual(provider.config, config);
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
    const provider = new o.RmqProvider({newInstance: true});
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
    const provider = new o.RmqProvider({newInstance: true});
    const _reconnect = o.sinon.spy(provider, '_reconnect');
    const connect = o.sinon.spy(provider, 'connect');
    const _reconnectConsumers = o.sinon.spy(provider, '_reconnectConsumers');
    const clock = o.sinon.useFakeTimers();
    provider.connect()
      .then(function() {
        provider.connection.emit('close');
        clock.tick(provider.config.reconnectAfter);
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
    const provider = new o.RmqProvider({newInstance: true});
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
      const provider = new o.RmqProvider({newInstance: true});
      yield provider.connect();
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
      yield provider.connect();
      const nack = o.sinon.stub(provider.channel, 'nack');
      provider.messages.abc = {
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
      yield provider.connect();
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
      yield provider.connect();
      const cancel = o.sinon.spy(provider.channel, 'cancel');
      const queue = o.shortid.generate();
      yield provider.cancel('abc');
      o.sinon.assert.calledOnce(cancel);
      done();
    })
    .catch((err) => {
      done(err);
    });
  });
});
