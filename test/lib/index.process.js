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
  properties: {
    input: {
      queue: o.shortid.generate(),
    },
  },
});

describe.skip('process', function() {
  it('should process with ack', function(done) {
    return o.co(function* coroutine() {
      const ack = o.sinon.stub(brick.messaging, 'ack', function() {
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
      const _produce = o.sinon.stub(brick.messaging, 'produce', function() {
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
