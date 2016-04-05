'use strict';

// publish message
const IoLib = require('../../lib');

const provider = process.argv.slice(2).join() || 'rabbitmq';
console.log('Using provider "' + provider + '"');

const io = new IoLib(provider);

const json = {
  id: '123',
  status: 'ok',
  description: 'simple test',
};

io.publish({
  key: 'test_key',
  json: json,
}).then(function(response) {
  console.log('response: ', response);
}, function(err) {
  console.error('error: ', err);
});
