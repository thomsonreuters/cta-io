'use strict';

const o = require('../../common');
const global = {
  queue1: o.shortid.generate(),
  queue2: o.shortid.generate(),
  key1: o.shortid.generate(),
  key2: o.shortid.generate(),
};

describe.skip('index / listeners', function() {
  Object.keys(o.providers).forEach(function(provider) {
    context(provider + ' provider', function() {
      const io = new o.Io(provider);
      it('register first consumer for queue2 with promise callback', function(done) {
        function cb(json) {
          global.consumed1 = json;
          return new Promise((resolve) => {
            setTimeout(function() {
              resolve();
            }, 500);
          });
        }
        io.consume({
          queue: global.queue2,
          cb: cb,
        }).then(function(response) {
          o.assert.property(response, 'result');
          global.consumer1 = response.result.consumerTag;
          done();
        }).catch(function(err) {
          done(err);
        });
      });

      it('queue2 should have 0 messages count', function(done) {
        io.info({
          queue: global.queue2,
        }).then(function(response) {
          o.assert.property(response, 'result');
          o.assert.propertyVal(response.result, 'messageCount', 0);
          done();
        }).catch(function(err) {
          done(err);
        });
      });

      it('produce first message in queue2', function(done) {
        const json = o.json();
        io.produce({
          queue: global.queue2,
          json: json,
        }).then(function(response) {
          o.assert.property(response, 'result');
          setTimeout(function() {
            o.assert.deepEqual(json, global.consumed1);
            done();
          }, 500);
        }).catch(function(err) {
          done(err);
        });
      });

      it('queue2 should still have 0 messages count, since already consumed by consumer1', function(done) {
        io.info({
          queue: global.queue2,
        }).then(function(response) {
          o.assert.property(response, 'result');
          o.assert.propertyVal(response.result, 'messageCount', 0);
          done();
        }).catch(function(err) {
          done(err);
        });
      });

      it('cancel consumer1', function(done) {
        return o.co(function* coroutine () {
          const cancel = yield io.cancel(global.consumer1);
          o.assert.property(cancel, 'result');
          done();
        })
          .catch((err) => {
            done(err);
          });
      });

      it('produce second message in queue2', function(done) {
        const json = o.json();
        io.produce({
          queue: global.queue2,
          json: json,
        }).then(function(response) {
          o.assert.property(response, 'result');
          global.produced = json;
          done();
        }).catch(function(err) {
          done(err);
        });
      });

      it('queue2 should now have 1 messages count, since no consumers', function(done) {
        io.info({
          queue: global.queue2,
        }).then(function(response) {
          o.assert.property(response, 'result');
          o.assert.propertyVal(response.result, 'messageCount', 1);
          done();
        }).catch(function(err) {
          done(err);
        });
      });
    });
  });
});
