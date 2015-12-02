'use strict';

const SqrLib = require('../lib/index.js');
const common = require('../lib/common.js');
const q = require('q');
const main = [{
  method: 'publish',
}, {
  method: 'subscribe',
}];

function Tests() {
  it('produce', function(done) {
    const sqr = new SqrLib(this.provider);
    sqr.produce({
      queue: 'test',
      json: {
        wait: 3,
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
    function fct(msg) {
      const deferred = q.defer();
      const json = common.bufferToJSON(msg.content);
      console.log('\n[x] Received', json);
      setTimeout(function() {
        console.log('\n[x] Done');
        deferred.resolve();
      }, json.wait * 1000);
      return deferred.promise;
    }
    sqr.consume({queue: 'test', fct: fct})
      .then(function(data) {
        console.log(data);
        done();
      }, function(err) {
        done(err);
      });
  });
  main.forEach(function(e) {
    it(e.method, function(done) {
      const sqr = new SqrLib(this.provider);
      sqr[e.method](this.id)
        .then(function(data) {
          console.log(data, '\n');
          done();
        }, function(err) {
          done(err);
        });
    });
  });
}

module.exports = Tests;
