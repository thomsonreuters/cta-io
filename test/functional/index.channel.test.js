'use strict';

const o = require('../common');
describe('functional: create channel retries', function() {
  it('should retry on failure', function(done) {
    const io = new o.Io('rabbitmq', {newInstance: true});
    let create;
    return o.co(function* coroutine() {
      // const clock = o.sinon.useFakeTimers();
      yield io._connect(false);
      create = o.sinon.stub(io.connection, 'createConfirmChannel', function(cb) {
        cb('error', null);
      });
      yield io._channel(false);
      done();
    })
    .catch((err) => {
      create.restore();
      o.sinon.assert.calledOnce(create);
      done();
    });
  });
});
