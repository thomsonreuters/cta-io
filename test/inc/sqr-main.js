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
  it('consume with promise callback', function(done) {
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

  it('produce for promise consumer', function(done) {
    const sqr = new SqrLib(this.provider);
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
    const sqr = new SqrLib(this.provider);
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
    const sqr = new SqrLib(this.provider);
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
    const sqr = new SqrLib(this.provider);
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
    const sqr = new SqrLib(this.provider);
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
      }, 100);
    }).catch(function(err) {
      done(err);
    });
  });

  it('subscribe with non promise callback', function(done) {
    const sqr = new SqrLib(this.provider);
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

  it('publish for non promise subscriber', function(done) {
    const sqr = new SqrLib(this.provider);
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
      }, 100);
    }).catch(function(err) {
      done(err);
    });
  });
};
