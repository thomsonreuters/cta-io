'use strict';

const IoLib = require('../../lib/io');

const provider = process.argv.slice(2).join() || 'rabbitmq';
console.log('Using provider "' + provider + '"');

const io = new IoLib(provider);

function cb(json) {
  return new Promise((resolve) => {
    resolve(json);
  });
}

io.subscribe({
  key: 'test_key',
  cb: cb,
}).then(function(response) {
  console.log('response: ', response);
}, function(err) {
  console.error('error: ', err);
});
