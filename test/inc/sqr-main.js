'use strict';

const SqrLib = require('../../lib');
const assert = require('chai').assert;
const global = {};

module.exports = function() {
  it('consume', function(done) {
    this.timeout(10000);
    const sqr = new SqrLib(this.provider);
    function cb(json) {
      global.consumed = json;
      return new Promise((resolve) => {
        setTimeout(function() {
          resolve();
        }, 1000);
      });
    }
    sqr.consume({
      queue: 'test',
      cb: cb,
    }).then(function(response) {
      assert.propertyVal(response, 'result', 'ok');
      done();
    }, function(err) {
      done(err);
    });
  });

  it('produce', function(done) {
    const sqr = new SqrLib(this.provider);
    const json = {
      produce: 'a job',
    };
    sqr.produce({
      queue: 'test',
      json: json,
    }).then(function(response) {
      assert.propertyVal(response, 'result', 'ok');
      setTimeout(function() {
        assert.deepEqual(json, global.consumed);
        done();
      }, 500);
    }, function(err) {
      done(err);
    });
  });

  it('subscribe', function(done) {
    const sqr = new SqrLib(this.provider);
    function cb(json) {
      global.published = json;
    }
    sqr.subscribe({
      key: 'test_key',
      cb: cb,
    }).then(function(response) {
      assert.propertyVal(response, 'result', 'ok');
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
    }).then(function(response) {
      assert.propertyVal(response, 'result', 'ok');
      setTimeout(function() {
        assert.deepEqual(json, global.published);
        done();
      }, 500);
    }, function(err) {
      done(err);
    });
  });
};
