'use strict';

const o = require('../common');
describe('functional: create channel retries', function() {
  it('should retry on failure', function(done) {
    let create;
    const io = new o.Io('rabbitmq', {newInstance: true});
    return o.co(function* coroutine() {
      io.config.reChannelAfter = 200;
      // const clock = o.sinon.useFakeTimers();
      yield io._connect(false);
      create = o.sinon.stub(io.connection, 'createConfirmChannel', function(cb) {
        cb('error', null);
      });
      yield io._channel(false);
      create.restore();
      done('Should not be here');
    })
    .catch((err) => {
      console.error('err: ', err);
      create.restore();
      o.sinon.assert.calledOnce(create);
      create = o.sinon.spy(io.connection, 'createConfirmChannel');
      setTimeout(function() {
        create.restore();
        o.sinon.assert.calledOnce(create);
        done();
      }, io.config.reChannelAfter);
    });
  });
});
