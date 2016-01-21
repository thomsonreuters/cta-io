'use strict';

const SqrLib = require('../../../lib');

const provider = process.argv.slice(2).join() || 'rabbitmq';
console.log('Using provider "' + provider + '"');

const sqr = new SqrLib(provider);

function cb(json) {
  return new Promise((resolve) => {
    resolve(json.key);
    sqr.publish({
      key: 'test_key',
      json: json,
    }).then(function(response) {
      // console.log('response', response);
    }, function(err) {
      console.error(err);
    });
  });
}

sqr.consume({
  queue: 'test',
  cb: cb,
}).then(function(response) {
  console.log('response', response);
}, function(err) {
  console.error(err);
});
