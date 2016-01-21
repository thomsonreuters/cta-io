'use strict';


const SqrLib = require('../../../lib');

const provider = process.argv.slice(2).join() || 'rabbitmq';
console.log('Using provider "' + provider + '"');

const sqr = new SqrLib(provider);

function cb(json) {
  // console.log('Received new message: ', json);
}

sqr.subscribe({
  key: 'test_key',
  cb: cb,
}).then(function(response) {
  console.log('response', response);
}, function(err) {
  console.error(err);
});
