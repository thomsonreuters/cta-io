'use strict';

const SqrLib = require('../../../lib');
const scheduler = require('node-schedule');

const data = require('./data');
const messages = data(1000);

const config = {
  cron: '*/1 * * * * *', // cron syntax for the producer to produce jobs
  current: -1,
};

/** store messages to be produced and those that are really consumed by the provider
 *  for comparison the end of the whole test */
// const produced = [];
// const consumed = [];

const provider = process.argv.slice(2).join() || 'rabbitmq';
console.log('Using provider "' + provider + '"');

const sqr = new SqrLib(provider);

function doSchedule() {
  config.current++;
  if (config.current > messages.length - 1) {
    console.log('No more messages to publish');
    console.log('Silo: ', sqr.provider.silo);
    config.j.cancel();
    setTimeout(function() {
      process.exit(0);
    }, 500);
    return;
  }

  sqr.produce({
    queue: 'test',
    json: {
      key: messages[config.current],
    },
  }).then(null, function(err) {
    console.error(err);
  });
}

config.j = scheduler.scheduleJob(config.cron, function() {
  doSchedule();
});
