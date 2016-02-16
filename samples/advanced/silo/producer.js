'use strict';

const shortid = require('shortid');
const SqrLib = require('../../../lib');
const util = require('util');
const os = require('os');
const path = require('path');
const filename = path.join(os.tmpDir(), 'silo_' + shortid.generate());

const data = require('./_data');
const messages = data();

const config = {
  current: -1,
  interval: null,
};

const provider = process.argv.slice(2).join() || 'rabbitmq';
console.log('Using provider "' + provider + '"');

const sqr = new SqrLib(provider, {
  silo: {
    provider: 'nedb',
    options: {
      filename: filename,
    },
  },
});

function doSchedule() {
  try {
    config.current++;
    // console.log('Current ' + config.current);
    if (config.current > messages.length - 1) {
      console.log('No more messages to produce');
      clearInterval(config.interval);
      return;
    }

    sqr.produce({
      queue: shortid.generate(),
      json: {
        key: messages[config.current],
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

config.interval = setInterval(doSchedule, 2000);
