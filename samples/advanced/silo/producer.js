'use strict';

const SqrLib = require('../../../lib');
const util = require('util');

const data = require('./_data');
const messages = data();

const config = {
  current: -1,
  interval: null,
};

const provider = process.argv.slice(2).join() || 'rabbitmq';
console.log('Using provider "' + provider + '"');

const sqr = new SqrLib(provider);

function doSchedule() {
  config.current++;
  // console.log('Current ' + config.current);
  if (config.current > messages.length - 1) {
    console.log('No more messages to produce');
    clearInterval(config.interval);
    return;
  }

  sqr.produce({
    queue: 'test',
    json: {
      key: messages[config.current],
    },
  }).then(function(response) {
    console.log('response:', response);
  }, function(err) {
    console.error('Producer error: ');
    console.error(util.inspect(err, {depth: 5}));
    // clearInterval(config.interval);
    /*
     config.j.cancel();
     setTimeout(function() {
     process.exit(0);
     }, 500);
     */
  });
}

config.interval = setInterval(doSchedule, 2000);
