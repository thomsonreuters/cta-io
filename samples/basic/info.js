'use strict';

// subscribe to receive messages
const IoLib = require('../../lib');

const provider = process.argv.slice(2).join() || 'rabbitmq';
console.log('Using provider "' + provider + '"');

const io = new IoLib(provider);

io.info({
  queue: 'test',
}).then(function(response) {
  console.log('response: ', response);
}, function(err) {
  console.error('error: ', err);
});
