'use strict';

// produce a job
const SqrLib = require('../../lib');

const provider = process.argv.slice(2).join() || 'rabbitmq';
console.log('Using provider "' + provider + '"');
const sqr = new SqrLib(provider);

sqr.produce({
  queue: 'test',
  json: {
    job: 'run command',
    cmd: 'ls',
  },
}).then(function() {
  console.log('\nProduced new job');
}, function(err) {
  console.error('Can\'t produce new job: ', err);
});
