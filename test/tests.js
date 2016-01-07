'use strict';

const SqrLib = require('../lib');
const assert = require('chai').assert;
const q = require('q');
const global = {};

function Tests() {
  /** ---------------------------------------------
   * produce
  ---------------------------------------------- */

  it('reject produce with missing param json', function(done) {
    const sqr = new SqrLib(this.provider);
    try {
      sqr.produce({
        json: {},
      }).then(function() {
        done('error');
      }, function() {
        done('error');
      });
    } catch (e) {
      console.log(e.message);
      done();
    }
  });

  it('reject produce with missing param queue', function(done) {
    const sqr = new SqrLib(this.provider);
    try {
      sqr.produce({
        queue: 'test',
      }).then(function() {
        done('error');
      }, function() {
        done('error');
      });
    } catch (e) {
      console.log(e.message);
      done();
    }
  });

  it('reject produce with wrong param type queue', function(done) {
    const sqr = new SqrLib(this.provider);
    try {
      sqr.produce({
        queue: {},
      }).then(function() {
        done('error');
      }, function() {
        done('error');
      });
    } catch (e) {
      console.log(e.message);
      done();
    }
  });

  it('reject produce with wrong param type json', function(done) {
    const sqr = new SqrLib(this.provider);
    try {
      sqr.produce({
        queue: 'test',
        json: 'test',
      }).then(function() {
        done('error');
      }, function() {
        done('error');
      });
    } catch (e) {
      console.log(e.message);
      done();
    }
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

  /** ---------------------------------------------
   * consume
   ---------------------------------------------- */

  it('reject consume with missing param queue', function(done) {
    const sqr = new SqrLib(this.provider);
    function cb() {
      const deferred = q.defer();
      deferred.resolve();
      return deferred.promise;
    }
    try {
      sqr.consume({
        cb: cb,
      }).then(function() {
        done('error');
      }, function() {
        done('error');
      });
    } catch (e) {
      console.log(e.message);
      done();
    }
  });

  it('reject consume with missing param cb', function(done) {
    const sqr = new SqrLib(this.provider);
    try {
      sqr.consume({
        queue: 'test',
      }).then(function() {
        done('error');
      }, function() {
        done('error');
      });
    } catch (e) {
      console.log(e.message);
      done();
    }
  });

  it('reject consume with wrong param queue', function(done) {
    const sqr = new SqrLib(this.provider);
    function cb() {
      const deferred = q.defer();
      deferred.resolve();
      return deferred.promise;
    }
    try {
      sqr.consume({
        queue: {},
        cb: cb,
      }).then(function() {
        done('error');
      }, function() {
        done('error');
      });
    } catch (e) {
      console.log(e.message);
      done();
    }
  });

  it('reject consume with wrong param cb', function(done) {
    const sqr = new SqrLib(this.provider);
    try {
      sqr.consume({
        queue: 'test',
        cb: {},
      }).then(function() {
        done('error');
      }, function() {
        done('error');
      });
    } catch (e) {
      console.log(e.message);
      done();
    }
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

  /** ---------------------------------------------
   * subscribe
   ---------------------------------------------- */

  it('reject subscribe with missing param key', function(done) {
    const sqr = new SqrLib(this.provider);
    try {
      sqr.subscribe({
        cb: function() {},
      }).then(function() {
        done('error');
      }, function() {
        done('error');
      });
    } catch (e) {
      console.log(e.message);
      done();
    }
  });

  it('reject subscribe with missing param cb', function(done) {
    const sqr = new SqrLib(this.provider);
    try {
      sqr.subscribe({
        key: 'test_key',
      }).then(function() {
        done('error');
      }, function() {
        done('error');
      });
    } catch (e) {
      console.log(e.message);
      done();
    }
  });

  it('reject subscribe with wrong param key', function(done) {
    const sqr = new SqrLib(this.provider);
    try {
      sqr.subscribe({
        key: 123,
        cb: function() {},
      }).then(function() {
        done('error');
      }, function() {
        done('error');
      });
    } catch (e) {
      console.log(e.message);
      done();
    }
  });

  it('reject subscribe with wrong param cb', function(done) {
    const sqr = new SqrLib(this.provider);
    try {
      sqr.subscribe({
        key: 'test_key',
        cb: 'abc',
      }).then(function() {
        done('error');
      }, function() {
        done('error');
      });
    } catch (e) {
      console.log(e.message);
      done();
    }
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

  /** ---------------------------------------------
   * publish
   ---------------------------------------------- */

  it('reject publish with missing param key', function(done) {
    const sqr = new SqrLib(this.provider);
    try {
      sqr.publish({
        json: {},
      }).then(function() {
        done('error');
      }, function() {
        done('error');
      });
    } catch (e) {
      console.log(e.message);
      done();
    }
  });

  it('reject publish with missing param json', function(done) {
    const sqr = new SqrLib(this.provider);
    try {
      sqr.publish({
        key: 'test_key',
      }).then(function() {
        done('error');
      }, function() {
        done('error');
      });
    } catch (e) {
      console.log(e.message);
      done();
    }
  });

  it('reject publish with wrong param type key', function(done) {
    const sqr = new SqrLib(this.provider);
    try {
      sqr.publish({
        key: 123,
        json: {},
      }).then(function() {
        done('error');
      }, function() {
        done('error');
      });
    } catch (e) {
      console.log(e.message);
      done();
    }
  });

  it('reject publish with wrong param type json', function(done) {
    const sqr = new SqrLib(this.provider);
    try {
      sqr.publish({
        key: 'test_key',
        json: 'abc',
      }).then(function() {
        done('error');
      }, function() {
        done('error');
      });
    } catch (e) {
      console.log(e.message);
      done();
    }
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
