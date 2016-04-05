'use strict';

const IoLib = require('cta-io');
const util = require('util');

const config = {
  queue: 'test_queue', // queue name
  current: -1, // job iterator
  max: 5, // max jobs to produce
  interval: null, // setInterval instance
  frequency: 1000, // setInterval frequency
};

const provider = process.argv.slice(2).join() || 'rabbitmq';
console.log('Using provider "' + provider + '"');

const io = new IoLib(provider, {});

function doSchedule() {
  try {
    config.current++;
    console.log('Current ' + config.current);
    if (config.current > config.max) {
      console.log('No more messages to produce');
      clearInterval(config.interval);
      return;
    }
    io.produce({
      queue: config.queue,
      json: {
        current: config.current,
      },
    }).then(function(response) {
      console.log('response:', response);
    }, function(err) {
      console.error('Producer error: ');
      console.error(util.inspect(err, {depth: 5}));
    });
  } catch (e) {
    console.error(e.message);
  }
}

config.interval = setInterval(doSchedule, config.frequency);
