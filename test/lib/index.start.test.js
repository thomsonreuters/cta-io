'use strict';

const o = require('../common');

describe('start', function() {
  const messaging = new o.Messaging();
  const cementHelper = {
    constructor: {
      name: 'CementHelper',
    },
    dependencies: {
      messaging: messaging,
    },
    createContext: function() {
      return {
        publish: function() {
        },
      };
    },
  };
  const brick = new o.Lib(cementHelper, {
    name: 'cta-io',
    properties: {},
  });
  beforeEach(function() {
    o.sinon.stub(messaging, 'consume');
    o.sinon.stub(messaging, 'subscribe');
  });

  afterEach(function() {
    messaging.consume.restore();
    messaging.subscribe.restore();
  });

  it('should start subscribe to one topic when provided', function(done) {
    o.co(function* coroutine() {
      const topic = o.shortid.generate();
      brick.properties.input.topic = topic;
      yield brick.start();
      o.sinon.assert.calledOnce(messaging.subscribe);
      const args = messaging.subscribe.getCalls()[0].args[0];
      o.assert.strictEqual(args.topic, topic);
      done();
    })
    .catch((err) => {
      done(err);
    });
  });

  it('should set topic ack mode when provided', function(done) {
    o.co(function* coroutine() {
      const topic = o.shortid.generate();
      brick.properties.input.topic = { name: topic, ack: 'auto' };
      yield brick.start();
      o.sinon.assert.calledOnce(messaging.subscribe);
      const args = messaging.subscribe.getCalls()[0].args[0];
      o.assert.strictEqual(args.topic, topic);
      o.assert.strictEqual(args.ack, 'auto');
      done();
    })
    .catch((err) => {
      done(err);
    });
  });

  it('should start subscribe to many topics when provided', function(done) {
    o.co(function* coroutine() {
      brick.properties.input.topic = [o.shortid.generate(), o.shortid.generate()];
      yield brick.start();
      o.sinon.assert.calledTwice(messaging.subscribe);
      done();
    })
    .catch((err) => {
      done(err);
    });
  });

  it('should start consume from queue when provided', function(done) {
    o.co(function* coroutine() {
      const queue = o.shortid.generate();
      brick.properties.input.queue = queue;
      yield brick.start();
      o.sinon.assert.calledOnce(messaging.consume);
      const args = messaging.consume.getCalls()[0].args[0];
      o.assert.strictEqual(args.queue, queue);
      done();
    })
    .catch((err) => {
      done(err);
    });
  });

  it('should set queue ack mode when provided', function(done) {
    o.co(function* coroutine() {
      const queue = o.shortid.generate();
      brick.properties.input.queue = { name: queue, ack: 'auto' };
      yield brick.start();
      o.sinon.assert.calledOnce(messaging.consume);
      const args = messaging.consume.getCalls()[0].args[0];
      o.assert.strictEqual(args.queue, queue);
      o.assert.strictEqual(args.ack, 'auto');
      done();
    })
    .catch((err) => {
      done(err);
    });
  });

  it('should start consume from many queues when provided', function(done) {
    o.co(function* coroutine() {
      brick.properties.input.queue = [o.shortid.generate(), o.shortid.generate()];
      yield brick.start();
      o.sinon.assert.calledTwice(messaging.consume);
      done();
    })
    .catch((err) => {
      done(err);
    });
  });

  it('should start consume from queues and subscribe to topics when both are provided', function(done) {
    o.co(function* coroutine() {
      brick.properties.input.queue = [o.shortid.generate(), o.shortid.generate()];
      brick.properties.input.topic = [o.shortid.generate(), o.shortid.generate()];
      yield brick.start();
      o.sinon.assert.calledTwice(messaging.consume);
      o.sinon.assert.calledTwice(messaging.subscribe);
      done();
    })
    .catch((err) => {
      done(err);
    });
  });

  it('should not start subscribe/consume when no input properties are provided', function(done) {
    o.co(function* coroutine() {
      brick.properties.input = {};
      yield brick.start();
      o.sleep(1000);
      o.sinon.assert.notCalled(messaging.consume);
      o.sinon.assert.notCalled(messaging.subscribe);
      done();
    })
    .catch((err) => {
      done(err);
    });
  });
});
