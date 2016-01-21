'use strict';

// consume message
const SqrLib = require('../../lib');

const provider = process.argv.slice(2).join() || 'rabbitmq';
console.log('Using provider "' + provider + '"');

const sqr = new SqrLib(provider);

function cb(json) {
  return new Promise((resolve) => {
    console.log('Received new message: ', json);
    // adding timeout to simulate job running
    setTimeout(function() {
      resolve(json);
    }, 500);
  });
}

sqr.consume({
  queue: 'test',
  cb: cb,
}).then(function(response) {
  console.log('response: ', response);
}, function(err) {
  console.error('error: ', err);
});
