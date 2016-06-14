'use strict';

const IoLib = require('../../lib/io');

const provider = process.argv.slice(2).join() || 'rabbitmq';
console.log('Starting UI to subscribe to job results using provider "' + provider + '"');

const io = new IoLib(provider);
const queue = 'output.deferred';

function cb(json) {
  return new Promise((resolve) => {
    resolve(json);
  });
}

io.consume({
  queue: queue,
  cb: cb,
}).then(function(response) {
  console.log('response: ', response);
}, function(err) {
  console.error('error: ', err);
});
