'use strict';

const o = require('../common');
const Context = require('events').EventEmitter;

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
const brick = new o.Lib(cementHelper, {
  name: 'cta-io',
  properties: {},
});

describe('process', function() {
  it('should process with ack', function(done) {
    return o.co(function* coroutine() {
      const _ack = o.sinon.stub(brick.messaging, 'ack', function() {
        return Promise.resolve();
      });
      const context = new Context();
      context.data = {
        nature: {
          type: 'message',
          quality: 'acknowledge',
        },
        payload: {
          id: 'abc',
        },
      };
      yield brick.process(context);
      _ack.restore();
      o.sinon.assert.calledWith(_ack, 'abc');
      done();
    })
    .catch((err) => {
      done(err);
    });
  });

  it('should process with get', function(done) {
    return o.co(function* coroutine() {
      const _get = o.sinon.stub(brick.messaging, 'get', function() {
        return Promise.resolve({
          result: {
            json: {
              id: 1,
            },
          },
        });
      });
      const context = new Context();
      context.data = {
        nature: {
          type: 'message',
          quality: 'get',
        },
        payload: {
          queue: 'abc',
        },
      };
      yield brick.process(context);
      _get.restore();
      o.sinon.assert.calledWith(_get, {queue: 'abc'});
      done();
    })
    .catch((err) => {
      done(err);
    });
  });

  it('should process with subscribe', function(done) {
    return o.co(function* coroutine() {
      const stub = o.sinon.stub(brick.messaging, 'subscribe', function() {
        return Promise.resolve({
          result: {},
        });
      });
      const context = new Context();
      context.data = {
        nature: {
          type: 'message',
          quality: 'subscribe',
        },
        payload: {
          topic: o.shortid.generate(),
        },
      };
      yield brick.process(context);
      stub.restore();
      o.sinon.assert.calledOnce(stub);
      done();
    })
      .catch((err) => {
        done(err);
      });
  });

  it('should process with consume', function(done) {
    return o.co(function* coroutine() {
      const stub = o.sinon.stub(brick.messaging, 'consume', function() {
        return Promise.resolve({
          result: {},
        });
      });
      const context = new Context();
      context.data = {
        nature: {
          type: 'message',
          quality: 'consume',
        },
        payload: {
          queue: o.shortid.generate(),
        },
      };
      yield brick.process(context);
      stub.restore();
      o.sinon.assert.calledOnce(stub);
      done();
    })
    .catch((err) => {
      done(err);
    });
  });

  context('should process with publish', () => {
    it('default topic', function(done) {
      return o.co(function* coroutine() {
        const b = new o.Lib(cementHelper, {
          name: 'cta-io',
          properties: {
            output: {
              topic: o.shortid.generate(),
            },
          },
        });
        const stub = o.sinon.stub(b.messaging, 'publish', function() {
          return Promise.resolve({
            result: {},
          });
        });
        const context = new Context();
        context.data = {
          nature: {
            type: 'message',
            quality: 'publish',
          },
          payload: {
            id: '01',
            status: 'ok',
            description: 'done',
          },
        };
        yield b.process(context);
        stub.restore();
        o.sinon.assert.calledWith(stub, {
          topic: b.output.topic,
          json: context.data.payload,
        });
        done();
      })
      .catch((err) => {
        done(err);
      });
    });
    it('dynamic topic', function(done) {
      return o.co(function* coroutine() {
        const b = new o.Lib(cementHelper, {
          name: 'cta-io',
          properties: {},
        });
        const stub = o.sinon.stub(b.messaging, 'publish', function() {
          return Promise.resolve({
            result: {},
          });
        });
        const context = new Context();
        context.data = {
          nature: {
            type: 'message',
            quality: 'publish',
          },
          payload: {
            topic: o.shortid.generate(),
            message: {
              id: '01',
              status: 'ok',
              description: 'done',
            },
          },
        };
        yield b.process(context);
        stub.restore();
        o.sinon.assert.calledWith(stub, {
          topic: context.data.payload.topic,
          json: context.data.payload.message,
        });
        done();
      })
      .catch((err) => {
        done(err);
      });
    });
  });

  it('should process with produce', function(done) {
    return o.co(function* coroutine() {
      const _produce = o.sinon.stub(brick.messaging, 'produce', function() {
        return Promise.resolve({
          result: {},
        });
      });
      const context = new Context();
      context.data = {
        nature: {
          type: 'message',
          quality: 'produce',
        },
        payload: {
          queue: o.shortid.generate(),
          message: {
            id: '01',
            status: 'ok',
            message: 'done',
          },
        },
      };
      yield brick.process(context);
      _produce.restore();
      o.sinon.assert.calledWith(_produce, {
        queue: context.data.payload.queue,
        json: context.data.payload.message,
      });
      done();
    })
    .catch((err) => {
      done(err);
    });
  });
});
