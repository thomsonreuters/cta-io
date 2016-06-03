'use strict';

const o = require('../../common');
const Context = require('events').EventEmitter;

describe('index / io as a brick', function() {
  it('contructor', function() {
    const brick = new o.IoBrick({}, {
      name: 'cta-io',
      properties: {
        provider: {
          name: 'rabbitmq',
        },
      },
    });
    o.assert.instanceOf(brick.io, o.providers.rabbitmq);
  });

  it('should call provided method on start property', function(done) {
    return o.co(function* coroutine() {
      const brick = new o.IoBrick({}, {
        name: 'cta-io',
        properties: {
          provider: {
            name: 'rabbitmq',
          },
          start: {
            method: 'subscribe',
            params: {
              key: 'key',
              cb: function(){},
            },
          },
        },
      });
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

  it('should process with execution acknowledge', function(done) {
    return o.co(function* coroutine() {
      const brick = new o.IoBrick({}, {
        name: 'cta-io',
        properties: {
          provider: {
            name: 'rabbitmq',
          },
        },
      });
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

  it('should process with queue get', function(done) {
    return o.co(function* coroutine() {
      const brick = new o.IoBrick({}, {
        name: 'cta-io',
        properties: {
          provider: {
            name: 'rabbitmq',
          },
        },
      });
      const _get = o.sinon.stub(brick.io, 'get', function(queue) {
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
});
