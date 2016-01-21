'use strict';

// subscribe to receive messages
const SqrLib = require('../../lib');

const provider = process.argv.slice(2).join() || 'rabbitmq';
console.log('Using provider "' + provider + '"');

const sqr = new SqrLib(provider);

function cb(json) {
  return new Promise((resolve) => {
    console.log('Received new message: ', json);
    resolve(json);
  });
}

sqr.subscribe({
  key: 'test_key',
  cb: cb,
}).then(function(response) {
  console.log('response: ', response);
}, function(err) {
  console.error('error: ', err);
});
