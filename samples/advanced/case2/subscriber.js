'use strict';

// subscribe to events
const _ = require('lodash');
const SqrLib = require('../../lib');
const data = require('./data');
const messages = data();
const consumed = [];

const provider = process.argv.slice(2).join() || 'rabbitmq';
console.log('Using provider "' + provider + '"');
const sqr = new SqrLib(provider);

function cb(json) {
  console.log('Received new message: ', json);
  consumed.push(json.key);
  const diff = _.difference(messages, consumed);
  console.log('Consumed: ' + consumed.length + ', Remaining: ' + diff.length);
}

sqr.subscribe({
  key: 'test_key',
  cb: cb,
}).then(function() {
  console.log('\nSubscribed');
}, function(err) {
  console.error('\nCan\'t subscribe: ', err);
});
