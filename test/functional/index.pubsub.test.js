'use strict';

const o = require('../common');
const global = {
  queue1: o.shortid.generate(),
  queue2: o.shortid.generate(),
  key1: o.shortid.generate(),
  key2: o.shortid.generate(),
};

describe('index / pub-sub', function() {
  Object.keys(o.providers).forEach(function(provider) {
    context(provider + ' provider', function() {
      const io = new o.Io(provider);
      it('subscribe to key1 with promise callback', function(done) {
        function cb (json) {
          global.published1 = json;
          return new Promise((resolve) => {
            setTimeout(function() {
              resolve();
            }, 500);
          });
        }
        io.subscribe({
          queue: global.key1,
          cb: cb,
        }).then(function(response) {
          o.assert.property(response, 'result');
          done();
        }).catch(function(err) {
          done(err);
        });
      });

      it('publish to key1', function(done) {
        const json = o.json();
        io.publish({
          queue: global.key1,
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

      it('subscribe to key2 with non promise callback', function(done) {
        function cb (json) {
          global.published2 = json;
          return true;
        }
        io.subscribe({
          queue: global.key2,
          cb: cb,
        }).then(function(response) {
          o.assert.property(response, 'result');
          done();
        }).catch(function(err) {
          done(err);
        });
      });

      it('publish to key2', function(done) {
        const json = o.json();
        io.publish({
          queue: global.key2,
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
