'use strict';

const SqrLib = require('../lib/index.js');
const assert = require('chai').assert;
const q = require('q');
const global = {};

function Tests() {
  it('reject produce with no params', function(done) {
    const sqr = new SqrLib(this.provider);
    sqr.produce()
    .then(function() {
      done('error');
    }, function(err) {
      console.log(err);
      assert(err);
      done();
    });
  });

  it('reject produce with missing param json', function(done) {
    const sqr = new SqrLib(this.provider);
    sqr.produce({
      json: {},
    }).then(function() {
      done('error');
    }, function(err) {
      console.log(err);
      assert(err);
      done();
    });
  });

  it('reject produce with missing param queue', function(done) {
    const sqr = new SqrLib(this.provider);
    sqr.produce({
      queue: 'test',
    }).then(function() {
      done('error');
    }, function(err) {
      console.log(err);
      assert(err);
      done();
    });
  });

  it('reject produce with wrong param type queue', function(done) {
    const sqr = new SqrLib(this.provider);
    sqr.produce({
      queue: {},
    }).then(function() {
      done('error');
    }, function(err) {
      console.log(err);
      assert(err);
      done();
    });
  });

  it('reject produce with wrong param type json', function(done) {
    const sqr = new SqrLib(this.provider);
    sqr.produce({
      queue: 'test',
      json: 'test',
    }).then(function() {
      done('error');
    }, function(err) {
      console.log(err);
      assert(err);
      done();
    });
  });

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
      console.log('\nReceived', json);
      setTimeout(function() {
        console.log('\nDone');
        deferred.resolve();
      }, json.wait * 1000);
      return deferred.promise;
    }
    sqr.consume({
      queue: 'test',
      cb: cb,
    }).then(function() {
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
      console.log('\nReceived subscribed msg: ', json);
    }
    sqr.subscribe({
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
