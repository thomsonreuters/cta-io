'use strict';

const o = require('../../common');
const Context = require('events').EventEmitter;
let brick;

describe('unit: Io Brick', function() {

  beforeEach(function() {
    const cementHelper = {
      createContext: function() {
        return {
          publish: function() {
          },
        };
      },
    };
    brick = new o.IoBrick(cementHelper, {
      name: 'cta-io',
      properties: {
        providerName: 'rabbitmq',
        parameters: {
          inputQueue: 'queue',
          newInstance: true,
        },
      },
    });
  });

  it('should start subscribe method when inputQueue is provided', function(done) {
    return o.co(function* coroutine() {
      const subscribe = o.sinon.spy(brick.io, 'subscribe');
      yield brick.start();
      subscribe.restore();
      o.sinon.assert.calledOnce(subscribe);
      done();
    })
    .catch((err) => {
      done(err);
    });
  });

  it('should process with ack', function(done) {
    return o.co(function* coroutine() {
      const ack = o.sinon.stub(brick.io, 'ack', function() {
        return Promise.resolve();
      });
      const context = new Context();
      context.data = {
        nature: {
          type: 'execution',
          quality: 'acknowledge',
        },
        payload: {
          jobid: 'abc',
        },
      };
      yield brick.process(context);
      ack.restore();
      o.sinon.assert.calledOnce(ack);
      done();
    })
    .catch((err) => {
      done(err);
    });
  });

  it('should process with get', function(done) {
    return o.co(function* coroutine() {
      const _get = o.sinon.stub(brick.io, 'get', function() {
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
          type: 'queue',
          quality: 'get',
        },
        payload: {
          queue: 'abc',
        },
      };
      yield brick.process(context);
      _get.restore();
      o.sinon.assert.calledWith(_get, 'abc');
      done();
    })
    .catch((err) => {
      done(err);
    });
  });

  it('should process with produce', function(done) {
    return o.co(function* coroutine() {
      const _produce = o.sinon.stub(brick.io, 'produce', function() {
        return Promise.resolve({
          result: {},
        });
      });
      const context = new Context();
      context.data = {
        payload: {
          id: '01',
          status: 'ok',
          message: 'done',
        },
      };
      yield brick.process(context);
      _produce.restore();
      o.sinon.assert.calledOnce(_produce);
      done();
    })
    .catch((err) => {
      done(err);
    });
  });
});
