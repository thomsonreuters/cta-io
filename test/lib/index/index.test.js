'use strict';

const o = require('../../common');
const Context = require('events').EventEmitter;
const context = new Context();
let brick;

describe('index / io as a brick', function() {
  it('contructor', function() {
    brick = new o.IoBrick({}, {
      name: 'cta-io',
      properties: {
        provider: {
          name: 'rabbitmq',
          options: {},
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
    o.assert.instanceOf(brick.io, o.providers.rabbitmq);
  });

  it('should call provided method on start property', function(done) {
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

  it.skip('should process with execution acknowledgement', function(done) {
    return o.co(function* coroutine() {
      const ack = o.sinon.stub(brick.io, 'ack', function() {
        return Promise.resolve();
      });
      context.data = {
        nature: {
          type: 'execution',
          quality: 'acknowledge',
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
});
