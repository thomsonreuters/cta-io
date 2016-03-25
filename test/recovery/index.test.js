'use strict';

const assert = require('chai').assert;
const shortid = require('shortid');

const SqrLib = require('../../lib');
const providers = require('../../lib/providers');

function iterations(from, to, global) {
  it(`Iterations from ${from} to ${to}`, function(done) {
    this.timeout(10000);
    const steps = [];
    for (let i = from; i <= to; i++) {
      steps.push(function() {
        global.index++;
        return new Promise((resolve, reject) => {
          global.producer.produce({
            queue: global.queue,
            json: {
              index: global.index,
            },
          })
          .then(function(response) {
            console.log('response:', response);
            global.produced.push(response.params.json.index);
            resolve();
          })
          .catch(function(err) {
            console.error('Producer error: ', err);
            reject();
          });
        });
      });
    }
    Promise.all(steps)
      .then(function() {
        done();
      })
      .catch(function() {
        done();
      });
  });
}

// TODO automate provider reconnection to test recovery
describe.skip('Should survive to provider\'s backend restarts', function() {
  Object.keys(providers).forEach(function(provider) {
    const global = {
      index: 1,
      queue: shortid.generate(),
      key: shortid.generate(),
      producer: null,
      produced: [],
      consumer: null,
      consumed: [],
      publisher: null,
      published: [],
      subscriber: null,
      subscribed: [],
    };

    context(provider, function() {
      it('register a subscriber', function(done) {
        global.subscriber = new SqrLib(provider);
        global.subscriber.subscribe({
          key: global.key,
          cb: function(json) {
            global.subscribed.push(json.index);
          },
        }).then(function(response) {
          assert.propertyVal(response, 'result', 'ok');
          done();
        }).catch(function(err) {
          done(err);
        });
      });

      it('register a consumer', function(done) {
        global.consumer = new SqrLib(provider);
        global.consumer.consume({
          queue: global.queue,
          cb: function(json) {
            global.consumed.push(json.index);
          },
        }).then(function(response) {
          assert.propertyVal(response, 'result', 'ok');
          done();
        }).catch(function(err) {
          done(err);
        });
      });

      it('register a publisher', function() {
        global.publisher = new SqrLib(provider);
        assert(!global.publisher.hasOwnProperty('publish'));
      });

      it('register a producer', function() {
        global.producer = new SqrLib(provider);
        assert(!global.producer.hasOwnProperty('produce'));
      });

      iterations(1, 3, global);

      it('Stop ' + provider + ' provider', function(done) {
        // TODO handle stop programatically
        this.timeout(12000);
        setTimeout(function() {
          done();
        }, 10000);
      });

      iterations(4, 6, global);

      it('Start ' + provider + ' provider', function(done) {
        // TODO handle start programatically
        this.timeout(12000);
        setTimeout(function() {
          done();
        }, 10000);
      });

      iterations(7, 9, global);

      it('checking results', function() {
        assert.equal(global.produced.length, global.consumed.length);
      });
    });
  });
});
