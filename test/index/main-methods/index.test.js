'use strict';

const o = require('../../common');
const global = {
  queue1: o.shortid.generate(),
  queue2: o.shortid.generate(),
  key1: o.shortid.generate(),
  key2: o.shortid.generate(),
};

describe('index -> main methods', function() {
  Object.keys(o.providers).forEach(function(provider) {
    context(provider + ' common methods', function() {
      it('consume with promise callback', function(done) {
        const io = new o.Io(provider);
        function cb(json) {
          global.consumed1 = json;
          return new Promise((resolve) => {
            setTimeout(function() {
              resolve();
            }, 500);
          });
        }
        io.consume({
          queue: global.queue1,
          cb: cb,
        }).then(function(response) {
          o.assert.property(response, 'result');
          global.consumer1 = response.result.consumerTag;
          done();
        }).catch(function(err) {
          done(err);
        });
      });

      it('produce for promise consumer', function(done) {
        const io = new o.Io(provider);
        const json = {
          produce: 'for promise consumer',
        };
        io.produce({
          queue: global.queue1,
          json: json,
        }).then(function(response) {
          o.assert.property(response, 'result');
          setTimeout(function() {
            o.assert.deepEqual(json, global.consumed1);
            done();
          }, 100);
        }).catch(function(err) {
          done(err);
        });
      });

      it('get queue info', function(done) {
        const io = new o.Io(provider);
        io.info({
          queue: global.queue1,
        }).then(function(response) {
          o.assert.property(response, 'result');
          o.assert.propertyVal(response.result, 'messageCount', 0);
          done();
        }).catch(function(err) {
          done(err);
        });
      });

      it('cancel consumer', function(done) {
        return o.co(function* coroutine() {
          const io = new o.Io(provider);
          // first, cancel consumer1
          const cancel = yield io.cancel(global.consumer1);
          o.assert.property(cancel, 'result');
          // then, produce a msg in the consumer1 queue
          const produce = yield io.produce({
            queue: global.queue1,
            json: { date: new Date() },
          });
          o.assert.property(produce, 'result');
          // finally, get queue info
          const info = yield io.info({
            queue: global.queue1,
          });
          o.assert.property(info, 'result');
          // the msg shouldn't be consumed
          o.assert.propertyVal(info.result, 'messageCount', 1);
          done();
        })
        .catch((err) => {
          done(err);
        });
      });

      it('consume with non promise callback', function(done) {
        const io = new o.Io(provider);
        function cb(json) {
          global.consumed2 = json;
          return true;
        }
        io.consume({
          queue: global.queue2,
          cb: cb,
        }).then(function(response) {
          o.assert.property(response, 'result');
          done();
        }).catch(function(err) {
          done(err);
        });
      });

      it('produce for non promise consumer', function(done) {
        const io = new o.Io(provider);
        const json = {
          produce: 'for non promise consumer',
        };
        io.produce({
          queue: global.queue2,
          json: json,
        }).then(function(response) {
          o.assert.property(response, 'result');
          setTimeout(function() {
            o.assert.deepEqual(json, global.consumed2);
            done();
          }, 100);
        }).catch(function(err) {
          done(err);
        });
      });

      it('subscribe with promise callback', function(done) {
        const io = new o.Io(provider);
        function cb(json) {
          global.published1 = json;
          return new Promise((resolve) => {
            setTimeout(function() {
              resolve();
            }, 500);
          });
        }
        io.subscribe({
          key: global.key1,
          cb: cb,
        }).then(function(response) {
          o.assert.property(response, 'result');
          done();
        }).catch(function(err) {
          done(err);
        });
      });

      it('publish for promise subscriber', function(done) {
        const io = new o.Io(provider);
        const json = {
          publish: 'for promise subscriber',
        };
        io.publish({
          key: global.key1,
          json: json,
        }).then(function(response) {
          o.assert.property(response, 'result');
          setTimeout(function() {
            o.assert.deepEqual(json, global.published1);
            done();
          }, 500);
        }).catch(function(err) {
          done(err);
        });
      });

      it('subscribe with non promise callback', function(done) {
        const io = new o.Io(provider);
        function cb(json) {
          global.published2 = json;
          return true;
        }
        io.subscribe({
          key: global.key2,
          cb: cb,
        }).then(function(response) {
          o.assert.property(response, 'result');
          done();
        }).catch(function(err) {
          done(err);
        });
      });

      it('publish for non promise subscriber', function(done) {
        const io = new o.Io(provider);
        const json = {
          publish: 'for non promise subscriber',
        };
        io.publish({
          key: global.key2,
          json: json,
        }).then(function(response) {
          o.assert.property(response, 'result');
          setTimeout(function() {
            o.assert.deepEqual(json, global.published2);
            done();
          }, 500);
        }).catch(function(err) {
          done(err);
        });
      });
    });
  });
});
