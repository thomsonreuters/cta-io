'use strict';

// consume a job
const _ = require('lodash');
const SqrLib = require('../../../lib');
const data = require('./_data');
const messages = data();
const consumed = [];

const provider = process.argv.slice(2).join() || 'rabbitmq';
console.log('Using provider "' + provider + '"');
const sqr = new SqrLib(provider);

function cb(json) {
  return new Promise((resolve) => {
    consumed.push(json.key);
    const diff = _.difference(messages, consumed);
    console.log('Consumed: ' + consumed.length + ', Remaining: ' + diff.length);
    setTimeout(function() {
      resolve();
      console.log('Should publish here, ' + json.key);
      sqr.publish({
        key: 'test_key',
        json: json,
      }).then(function() {
        console.log('\nPublished');
      }, function(err) {
        console.error('\nCan\'t publish: ', err);
      });
    }, 500);
  });
}

sqr.consume({
  queue: 'test',
  cb: cb,
}).then(null, function(err) {
  console.error(err);
});
