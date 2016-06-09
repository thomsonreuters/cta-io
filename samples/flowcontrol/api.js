'use strict';

const IoLib = require('../../lib/io');

const provider = process.argv.slice(2).join() || 'rabbitmq';
console.log('Starting API to produce a job using provider "' + provider + '"');

function generate() {
  return Math.ceil(10 * Math.random());
}

const io = new IoLib(provider);
const queue = 'io.sample.input.queue';
const execution = {
  id: '001',
  nature: {
    type: 'execution',
    quality: 'commandline',
  },
  payload: {
    x: generate(),
    y: generate(),
  },
};

io.produce({
  queue: queue,
  json: execution,
}).then(function(response) {
  console.log('response: ', response);
}, function(err) {
  console.error('error: ', err);
});
