'use strict';

const SqrLib = require('../../lib');
const assert = require('chai').assert;
const shortid = require('shortid');
const global = {
  queue: shortid.generate(),
  key: shortid.generate(),
  consumed: null,
  published: null,
};

module.exports = function() {
  it('consume', function(done) {
    const sqr = new SqrLib(this.provider);
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

  it('produce', function(done) {
    const sqr = new SqrLib(this.provider);
    const json = {
      produce: 'a job',
    };
    sqr.produce({
      queue: global.queue,
      json: json,
    }).then(function(response) {
      assert.propertyVal(response, 'result', 'ok');
      setTimeout(function() {
        assert.deepEqual(json, global.consumed);
        done();
      }, 500);
    }).catch(function(err) {
      done(err);
    });
  });

  it('subscribe', function(done) {
    const sqr = new SqrLib(this.provider);
    function cb(json) {
      global.published = json;
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

  it('publish', function(done) {
    const sqr = new SqrLib(this.provider);
    const json = {
      id: '123',
      status: 'ok',
      description: 'simple test',
    };
    sqr.publish({
      key: global.key,
      json: json,
    }).then(function(response) {
      assert.propertyVal(response, 'result', 'ok');
      setTimeout(function() {
        assert.deepEqual(json, global.published);
        done();
      }, 500);
    }).catch(function(err) {
      done(err);
    });
  });
};
