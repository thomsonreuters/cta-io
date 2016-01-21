'use strict';

// publish message
const SqrLib = require('../../lib');

const provider = process.argv.slice(2).join() || 'rabbitmq';
console.log('Using provider "' + provider + '"');

const sqr = new SqrLib(provider);

const json = {
  id: '123',
  status: 'ok',
  description: 'simple test',
};

sqr.publish({
  key: 'test_key',
  json: json,
}).then(function(response) {
  console.log('response: ', response);
}, function(err) {
  console.error('error: ', err);
});
