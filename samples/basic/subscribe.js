'use strict';

// subscribe to receive messages
const IoLib = require('../../lib');

const provider = process.argv.slice(2).join() || 'rabbitmq';
console.log('Using provider "' + provider + '"');

const io = new IoLib(provider);

function cbp(json) {
  return new Promise((resolve) => {
    console.log('Received new message: ', json);
    resolve(json);
  });
}

function cbn(json) {
  console.log('Received new message: ', json);
}

io.subscribe({
  key: 'test_key',
  cb: cbn,
}).then(function(response) {
  console.log('response: ', response);
}, function(err) {
  console.error('error: ', err);
});
