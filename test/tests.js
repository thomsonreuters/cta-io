'use strict';

const SqrLib = require('../lib/index.js');
const common = require('../lib/common.js');
const assert = require('chai').assert;
const q = require('q');
const global = {};

function Tests() {

  it('produce', function(done) {
    const sqr = new SqrLib(this.provider);
    sqr.produce({
      queue: 'test',
      json: {
        wait: 1,
      },
    }).then(function() {
        done();
      }, function(err) {
        done(err);
      });
  });

  it('consume', function(done) {
    this.timeout(10000);
    const sqr = new SqrLib(this.provider);
    function cb(json) {
      const deferred = q.defer();
      console.log('\n[x] Received', json);
      setTimeout(function() {
        console.log('\n[x] Done');
        deferred.resolve();
      }, json.wait * 1000);
      return deferred.promise;
    }
    sqr.consume({queue: 'test', cb: cb})
      .then(function() {
        done();
      }, function(err) {
        done(err);
      });
  });

  it('subscribe', function(done) {
    this.timeout(10000);
    const sqr = new SqrLib(this.provider);
    function cb(json) {
      global.published = json;
      console.log('\nreceived subscribed msg: ', json);
    }
    sqr.subscribe({
      ex: 'test_ex',
      key: 'test_key',
      cb: cb,
    }).then(function() {
      done();
    }, function(err) {
      done(err);
    });
  });

  it('publish', function(done) {
    const sqr = new SqrLib(this.provider);
    const json = {
      id: '123',
      status: 'ok',
      description: 'simple test',
    };
    sqr.publish({
      ex: 'test_ex',
      key: 'test_key',
      json: json,
    }).then(function() {
      setTimeout(function() {
        assert.deepEqual(json, global.published);
        done();
      }, 1000);
    }, function(err) {
      done(err);
    });
  });

}

module.exports = Tests;
