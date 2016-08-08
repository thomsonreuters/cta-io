'use strict';

const o = require('../common');

const cementHelper = {
  constructor: {
    name: 'CementHelper',
  },
  createContext: function() {
    return {
      publish: function() {
      },
    };
  },
};

describe('start', function() {
  it('should start subscribe method when provided', function(done) {
    return o.co(function* coroutine() {
      const brick = new o.Lib(cementHelper, {
        name: 'cta-io',
        properties: {
          input: {
            topic: o.shortid.generate(),
          },
        },
      });
      const subscribe = o.sinon.spy(brick.messaging, 'subscribe');
      yield brick.start();
      subscribe.restore();
      o.sinon.assert.calledOnce(subscribe);
      done();
    })
    .catch((err) => {
      done(err);
    });
  });
  it('should start consume method when provided', function(done) {
    return o.co(function* coroutine() {
      const brick = new o.Lib(cementHelper, {
        name: 'cta-io',
        properties: {
          input: {
            queue: o.shortid.generate(),
          },
        },
      });
      const consume = o.sinon.spy(brick.messaging, 'consume');
      yield brick.start();
      consume.restore();
      o.sinon.assert.calledOnce(consume);
      done();
    })
    .catch((err) => {
      done(err);
    });
  });
  it('should start both when provided', function(done) {
    return o.co(function* coroutine() {
      const brick = new o.Lib(cementHelper, {
        name: 'cta-io',
        properties: {
          input: {
            queue: [o.shortid.generate(), o.shortid.generate()],
            topic: [o.shortid.generate(), o.shortid.generate()],
          },
        },
      });
      const consume = o.sinon.spy(brick.messaging, 'consume');
      const subscribe = o.sinon.spy(brick.messaging, 'subscribe');
      yield brick.start();
      consume.restore();
      subscribe.restore();
      o.sinon.assert.calledTwice(consume);
      o.sinon.assert.calledTwice(subscribe);
      done();
    })
    .catch((err) => {
      done(err);
    });
  });
});
