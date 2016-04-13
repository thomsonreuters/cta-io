'use strict';

const o = require('../../common');
const global = {
  queue1: o.shortid.generate(),
  queue2: o.shortid.generate(),
  key1: o.shortid.generate(),
  key2: o.shortid.generate(),
  consumed: null,
  published: null,
};

describe('cta-io main module', function() {
  Object.keys(o.providers).forEach(function(provider) {
    context(provider + ' common methods', function() {
      it('consume with promise callback', function(done) {
        const io = new o.io(provider);
        function cb(json) {
          global.consumed = json;
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
          done();
        }).catch(function(err) {
          done(err);
        });
      });

      it('produce for promise consumer', function(done) {
        const io = new o.io(provider);
        const json = {
          produce: 'for promise consumer',
        };
        io.produce({
          queue: global.queue1,
          json: json,
        }).then(function(response) {
          o.assert.propertyVal(response, 'result', 'ok');
          setTimeout(function() {
            o.assert.deepEqual(json, global.consumed);
            done();
          }, 100);
        }).catch(function(err) {
          done(err);
        });
      });

      it('queue info', function(done) {
        const io = new o.io(provider);
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

      it('consume with non promise callback', function(done) {
        const io = new o.io(provider);
        function cb(json) {
          global.consumed = json;
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
        const io = new o.io(provider);
        const json = {
          produce: 'for non promise consumer',
        };
        io.produce({
          queue: global.queue2,
          json: json,
        }).then(function(response) {
          o.assert.propertyVal(response, 'result', 'ok');
          setTimeout(function() {
            o.assert.deepEqual(json, global.consumed);
            done();
          }, 100);
        }).catch(function(err) {
          done(err);
        });
      });

      it('subscribe with promise callback', function(done) {
        const io = new o.io(provider);
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
          o.assert.propertyVal(response, 'result', 'ok');
          done();
        }).catch(function(err) {
          done(err);
        });
      });

      it('publish for promise subscriber', function(done) {
        const io = new o.io(provider);
        const json = {
          publish: 'for promise subscriber',
        };
        io.publish({
          key: global.key1,
          json: json,
        }).then(function(response) {
          o.assert.propertyVal(response, 'result', 'ok');
          setTimeout(function() {
            o.assert.deepEqual(json, global.published1);
            done();
          }, 500);
        }).catch(function(err) {
          done(err);
        });
      });

      it('subscribe with non promise callback', function(done) {
        const io = new o.io(provider);
        function cb(json) {
          global.published2 = json;
          return true;
        }
        io.subscribe({
          key: global.key2,
          cb: cb,
        }).then(function(response) {
          o.assert.propertyVal(response, 'result', 'ok');
          done();
        }).catch(function(err) {
          done(err);
        });
      });

      it('publish for non promise subscriber', function(done) {
        const io = new o.io(provider);
        const json = {
          publish: 'for non promise subscriber',
        };
        io.publish({
          key: global.key2,
          json: json,
        }).then(function(response) {
          o.assert.propertyVal(response, 'result', 'ok');
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
