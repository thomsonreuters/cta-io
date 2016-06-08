'use strict';

const o = require('../../../../../common');

describe('rabbitmq common', function() {
  it('should set default params', function() {
    const defaults = require('../../../../../../lib/io/providers/rabbitmq/config.defaults');
    const io = new o.providers.rabbitmq();
    o.assert.deepEqual(io.config, {
      url: defaults.url,
      reconnectAfter: defaults.reconnectAfter,
      clearInterval: defaults.clearInterval,
      clearOffset: defaults.clearOffset,
    });
  });

  it('should set custom params', function() {
    const config = {
      url: 'amqp://mydomain.com',
      reconnectAfter: 10 * 1000,
      clearInterval: 60 * 60 * 1000,
      clearOffset: 2 * 60 * 60 * 1000,
    };
    const io = new o.providers.rabbitmq(config);
    o.assert.deepEqual(io.config, config);
  });

  it('processMsg', function() {
    const io = new o.providers.rabbitmq();
    let msg = {
      content: new Buffer(JSON.stringify({foo: 'bar'})),
    };
    let json = io._processMsg(msg, true);
    o.assert.property(json, 'id');
    o.assert.property(io.messages, json.id);
    o.assert.property(io.messages[json.id], 'msg');
    o.assert.property(io.messages[json.id], 'timestamp');
    msg = {
      content: new Buffer(JSON.stringify({id: 'def'})),
    };
    json = io._processMsg(msg);
    o.assert.property(json, 'id');
    o.assert.notProperty(io.messages, json.id);
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
      const provider = new o.providers.rabbitmq();
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
    const io = new o.providers.rabbitmq({
      clearInterval: 100,
    });
    const now = Date.now();
    io.messages = {
      a: {
        msg: {},
        timestamp: now - io.config.clearOffset,
      },
      b: {
        msg: {},
        timestamp: now,
      },
    };
    io._houseKeeping();
    setTimeout(function() {
      o.assert.sameMembers(Object.keys(io.messages), ['b']);
      done();
    }, io.config.clearInterval);
  });

  it('should return queue information', function (done) {
    return o.co(function* coroutine() {
      const io = new o.providers.rabbitmq();
      yield io.connect();
      const assertQueue = o.sinon.spy(io.channel, 'assertQueue');
      const queue = o.shortid.generate();
      yield io.info(queue);
      o.sinon.assert.calledOnce(assertQueue);
      done();
    })
      .catch((err) => {
        done(err);
      });
  });

  it('should cancel a consumer', function (done) {
    return o.co(function* coroutine() {
      const io = new o.providers.rabbitmq();
      yield io.connect();
      const cancel = o.sinon.spy(io.channel, 'cancel');
      const queue = o.shortid.generate();
      yield io.cancel('abc');
      o.sinon.assert.calledOnce(cancel);
      done();
    })
      .catch((err) => {
        done(err);
      });
  });
});
