'use strict';

// subscribe to events
const _ = require('lodash');
const SqrLib = require('../../../lib');
const data = require('./_data');
const messages = data();

const provider = process.argv.slice(2).join() || 'rabbitmq';
console.log('Using provider "' + provider + '"');

const sqr = new SqrLib(provider);

function cb(json) {
  console.log('Received new message: ', json);
}

sqr.subscribe({
  key: 'test_key',
  cb: cb,
}).then(function(response) {
  console.log('response', response);
}, function(err) {
  console.error(err);
});
