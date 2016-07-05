'use strict';

const o = require('../common');
const io = new o.Io('rabbitmq', {newInstance: true});
const queue = o.shortid.generate();

describe('functional: handle unknown delivery tag', function() {
  it('should redeliver non acked message', function(done) {
    return o.co(function* coroutine() {
      yield io._connect(false);
      yield io._channel(false);
      yield io.produce({
        queue: queue,
        json: {id: 'a'},
      });
      yield io.get({
        queue: queue,
      });
      o.assert.property(io.messages, 'a');
      yield io.nack({
        id: 'a',
        requeue: true,
      }); // force redelivery
      io.connection.emit('close');
      yield o.sleep(1000); // some delay to wait for connection close
      const res = yield io.info(queue);
      o.assert.strictEqual(res.result.messageCount, 1);
      done();
    })
    .catch((err) => {
      console.error(err);
      setTimeout(function() {
        done('err');
      }, 100);
    });
  });

  it('should ack message while offline', function(done) {
    return o.co(function* coroutine() {
      yield io.ack('a');
      o.assert.property(io.acked, 'a');
      o.assert.notProperty(io.messages, 'a');
      done();
    })
    .catch((err) => {
      console.error(err);
      setTimeout(function() {
        done('err');
      }, 100);
    });
  });

  it('should not get an already offline acked message', function(done) {
    return o.co(function* coroutine() {
      yield io._connect(true);
      yield io._channel(true);
      const res = yield io.get({
        queue: queue,
      });
      o.assert.strictEqual(res.result.json, null);
      setTimeout(function() {
        done();
      }, 100);
    })
    .catch((err) => {
      console.error(err);
      setTimeout(function() {
        done('err');
      }, 100);
    });
  });
});
