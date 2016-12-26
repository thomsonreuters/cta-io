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
    o.co(function* coroutine() {
      const _ack = o.sinon.stub(brick.messaging, 'ack', function() {
        return Promise.resolve();
      });
      const context = new Context();
      context.data = {
        nature: {
          type: 'messages',
          quality: 'acknowledge',
        },
        payload: {
          id: 'abc',
        },
      };
      yield brick.process(context);
      o.sinon.assert.calledWith(_ack, 'abc');
      _ack.restore();
      done();
    })
    .catch((err) => {
      done(err);
    });
  });

  it('should process with get', function(done) {
    o.co(function* coroutine() {
      const _get = o.sinon.stub(brick.messaging, 'get', function() {
        return Promise.resolve({
          result: {
            content: {
              id: 1,
            },
          },
        });
      });
      const context = new Context();
      context.data = {
        nature: {
          type: 'messages',
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
    o.co(function* coroutine() {
      const stub = o.sinon.stub(brick.messaging, 'subscribe', function() {
        return Promise.resolve({
          result: {},
        });
      });
      const context = new Context();
      const payload = {
        topic: o.shortid.generate(),
        cb: () => {},
      };
      context.data = {
        nature: {
          type: 'messages',
          quality: 'subscribe',
        },
        payload: payload,
      };
      yield brick.process(context);
      stub.restore();
      o.sinon.assert.calledWith(stub, payload);
      done();
    })
    .catch((err) => {
      done(err);
    });
  });

  it('should process with consume', function(done) {
    o.co(function* coroutine() {
      const stub = o.sinon.stub(brick.messaging, 'consume', function() {
        return Promise.resolve({
          result: {},
        });
      });
      const context = new Context();
      const payload = {
        queue: o.shortid.generate(),
        cb: () => {},
      };
      context.data = {
        nature: {
          type: 'messages',
          quality: 'consume',
        },
        payload: payload,
      };
      yield brick.process(context);
      stub.restore();
      o.sinon.assert.calledWith(stub, payload);
      done();
    })
    .catch((err) => {
      done(err);
    });
  });

  it('should process with publish on default topic', function(done) {
    o.co(function* coroutine() {
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
          type: 'messages',
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
        content: context.data.payload,
      });
      done();
    })
    .catch((err) => {
      done(err);
    });
  });

  it('should process with publish on default topic', function(done) {
    o.co(function* coroutine() {
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
          type: 'messages',
          quality: 'publish',
        },
        payload: {
          topic: o.shortid.generate(),
          content: {
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
        content: context.data.payload.content,
      });
      done();
    })
    .catch((err) => {
      done(err);
    });
  });

  it('should process with produce on default queue', (done) => {
    o.co(function* coroutine() {
      const b = new o.Lib(cementHelper, {
        name: 'cta-io',
        properties: {
          output: {
            queue: o.shortid.generate(),
          },
        },
      });
      const _produce = o.sinon.stub(brick.messaging, 'produce', function() {
        return Promise.resolve({
          result: {},
        });
      });
      const context = new Context();
      context.data = {
        nature: {
          type: 'messages',
          quality: 'produce',
        },
        payload: {
          id: '01',
          status: 'ok',
          message: 'done',
        },
      };
      yield b.process(context);
      _produce.restore();
      o.sinon.assert.calledWith(_produce, {
        queue: b.properties.output.queue,
        content: context.data.payload,
      });
      done();
    })
    .catch((err) => {
      done(err);
    });
  });

  it('should process with produce on dynamic queue', (done) => {
    o.co(function* coroutine() {
      const b = new o.Lib(cementHelper, {
        name: 'cta-io',
        properties: {},
      });
      const _produce = o.sinon.stub(brick.messaging, 'produce', function() {
        return Promise.resolve({
          result: {},
        });
      });
      const context = new Context();
      context.data = {
        nature: {
          type: 'messages',
          quality: 'produce',
        },
        payload: {
          queue: o.shortid.generate(),
          content: {
            id: '01',
            status: 'ok',
            message: 'done',
          },
        },
      };
      yield b.process(context);
      _produce.restore();
      o.sinon.assert.calledWith(_produce, {
        queue: context.data.payload.queue,
        content: context.data.payload.content,
      });
      done();
    })
    .catch((err) => {
      done(err);
    });
  });
});
