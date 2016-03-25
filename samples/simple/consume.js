'use strict';

// consume message
const IoLib = require('../../lib');

const provider = process.argv.slice(2).join() || 'rabbitmq';
console.log('Using provider "' + provider + '"');

const io = new IoLib(provider);

function cb(json) {
  return new Promise((resolve) => {
    console.log('Received new message: ', json);
    // adding timeout to simulate job running
    setTimeout(function() {
      resolve(json);
    }, 500);
  });
}

io.consume({
  queue: 'test',
  cb: cb,
}).then(function(response) {
  console.log('response: ', response);
}, function(err) {
  console.error('error: ', err);
});
