'use strict';

const o = require('../../../../../common');

describe('unit: rabbitmq subscribe', function() {
  it('subscribe with ack set to resolve', function(done) {
    return o.co(function* coroutine() {
      const provider = new o.RmqProvider({newInstance: true});
      yield provider._connect();
      const ack = o.sinon.stub(provider.channel, 'ack');
      const queue = o.shortid.generate();
      const json = {
        id: '01',
        timestamp: Date.now(),
      };
      const spy = o.sinon.spy();
      yield provider.subscribe({
        queue: queue,
        cb: spy,
        ack: 'resolve',
      });
      yield provider.publish({
        queue: queue,
        json: json,
      });
      setTimeout(function() {
        o.sinon.assert.calledOnce(spy);
        o.sinon.assert.calledWith(spy, json);
        o.sinon.assert.calledOnce(ack);
        done();
      }, 100);
    })
    .catch((err) => {
      done(err);
    });
  });

  it('subscribe with ack set to auto', function(done) {
    return o.co(function* coroutine() {
      const provider = new o.RmqProvider({newInstance: true});
      yield provider._connect();
      const _ack = o.sinon.stub(provider.channel, 'ack');
      const queue = o.shortid.generate();
      const json = {
        id: '01',
        timestamp: Date.now(),
      };
      const cb = function(doc) {
        return new Promise((resolve) => {
          setTimeout(function() {
            resolve(doc);
          }, 100);
        });
      };
      const _cb = o.sinon.spy(cb);
      yield provider.subscribe({
        queue: queue,
        cb: _cb,
        ack: 'auto',
      });
      yield provider.publish({
        queue: queue,
        json: json,
      });
      setTimeout(function() {
        _ack.restore();
        o.sinon.assert.notCalled(_ack);
        o.sinon.assert.calledOnce(_cb);
        o.sinon.assert.calledWith(_cb, json);
        done();
      }, 300);
    })
    .catch((err) => {
      done(err);
    });
  });
});
