'use strict';

const assert = require('chai').assert;
const SqrLib = require('../../lib');
const providers = require('../../lib/providers');
const validations = require('./_validations');
const shortid = require('shortid');
const global = {
  queue: shortid.generate(),
  key: shortid.generate(),
  consumed: null,
  published: null,
};

describe('SQR main module', function() {
  context('Instanciation', function() {
    it('reject if no provider passed', function() {
      try {
        const sqr = new SqrLib();
      } catch (e) {
        assert.equal(e.message, 'Missing provider name');
      }
    });
    it('reject if provider not found', function() {
      try {
        const sqr = new SqrLib('abc');
      } catch (e) {
        assert.equal(e.message, 'Unknown provider "abc"');
      }
    });
    it('pass custom options using rabbitmq provider', function() {
      const options = {
        url: 'amqp://my.mq.host',
      };
      const sqr = new SqrLib('rabbitmq', options);
      assert.equal(sqr.provider.options, options);
    });
    it('pass custom options using wampkue provider', function() {
      const options = {
        wamp: {
          url: 'ws://my.wamp.host/ws',
          realm: 'my.wamp.realm',
        },
        kue: {
          prefix: 'my.kue.prefix',
          redis: {
            port: 6000,
            host: 'my.redis.host',
          },
        },
      };
      const sqr = new SqrLib('wampkue', options);
      assert.equal(sqr.provider.options, options);
    });
  });
  Object.keys(providers).forEach(function(provider) {
    context(provider + ' common params validations', function() {
      Object.keys(validations).forEach(function(method) {
        const tests = validations[method];
        tests.forEach(function(test) {
          it(test.message, function(done) {
            const sqr = new SqrLib(provider);
            sqr[method](test.params)
              .then(function(data) {
                console.log('data: ', data);
                done('error');
              }, function(err) {
                console.log('err: ', err);
                done();
              });
          });
        });
      });
    });
    context(provider + ' common methods', function() {
      it('consume with promise callback', function(done) {
        const sqr = new SqrLib(provider);
        function cb(json) {
          global.consumed = json;
          return new Promise((resolve) => {
            setTimeout(function() {
              resolve();
            }, 500);
          });
        }
        sqr.consume({
          queue: global.queue,
          cb: cb,
        }).then(function(response) {
          assert.propertyVal(response, 'result', 'ok');
          done();
        }).catch(function(err) {
          done(err);
        });
      });

      it('produce for promise consumer', function(done) {
        const sqr = new SqrLib(provider);
        const json = {
          produce: 'for promise consumer',
        };
        sqr.produce({
          queue: global.queue,
          json: json,
        }).then(function(response) {
          assert.propertyVal(response, 'result', 'ok');
          setTimeout(function() {
            assert.deepEqual(json, global.consumed);
            done();
          }, 100);
        }).catch(function(err) {
          done(err);
        });
      });

      it('consume with non promise callback', function(done) {
        const sqr = new SqrLib(provider);
        function cb(json) {
          global.consumed = json;
          return true;
        }
        sqr.consume({
          queue: global.queue,
          cb: cb,
        }).then(function(response) {
          assert.propertyVal(response, 'result', 'ok');
          done();
        }).catch(function(err) {
          done(err);
        });
      });

      it('produce for non promise consumer', function(done) {
        const sqr = new SqrLib(provider);
        const json = {
          produce: 'for non promise consumer',
        };
        sqr.produce({
          queue: global.queue,
          json: json,
        }).then(function(response) {
          assert.propertyVal(response, 'result', 'ok');
          setTimeout(function() {
            assert.deepEqual(json, global.consumed);
            done();
          }, 100);
        }).catch(function(err) {
          done(err);
        });
      });

      it('subscribe with promise callback', function(done) {
        const sqr = new SqrLib(provider);
        function cb(json) {
          global.published1 = json;
          return new Promise((resolve) => {
            setTimeout(function() {
              resolve();
            }, 500);
          });
        }
        sqr.subscribe({
          key: global.key,
          cb: cb,
        }).then(function(response) {
          assert.propertyVal(response, 'result', 'ok');
          done();
        }).catch(function(err) {
          done(err);
        });
      });

      it('publish for promise subscriber', function(done) {
        const sqr = new SqrLib(provider);
        const json = {
          publish: 'for promise subscriber',
        };
        sqr.publish({
          key: global.key,
          json: json,
        }).then(function(response) {
          assert.propertyVal(response, 'result', 'ok');
          setTimeout(function() {
            assert.deepEqual(json, global.published1);
            done();
          }, 500);
        }).catch(function(err) {
          done(err);
        });
      });

      it.skip('subscribe with non promise callback', function(done) {
        const sqr = new SqrLib(provider);
        function cb(json) {
          global.published2 = json;
          return true;
        }
        sqr.subscribe({
          key: global.key,
          cb: cb,
        }).then(function(response) {
          assert.propertyVal(response, 'result', 'ok');
          done();
        }).catch(function(err) {
          done(err);
        });
      });

      it.skip('publish for non promise subscriber', function(done) {
        const sqr = new SqrLib(provider);
        const json = {
          publish: 'for non promise subscriber',
        };
        sqr.publish({
          key: global.key,
          json: json,
        }).then(function(response) {
          assert.propertyVal(response, 'result', 'ok');
          setTimeout(function() {
            assert.deepEqual(json, global.published2);
            done();
          }, 500);
        }).catch(function(err) {
          done(err);
        });
      });
    });
  });
});
