'use strict';

/** produces a job each xx seconds with a ready consumer,
 *  kills the provider, restart it
 *  then it should ensure that no messages have been lost */

const SqrLib = require('../../lib');
const scheduler = require('node-schedule');
// const moment = require('moment');
// const path = require('path');
// const _ = require('lodash');

const data = require('./data');
const messages = data();

const config = {
  cron: '*/1 * * * * *', // cron syntax for the producer to produce jobs
  /*
  root: 'd:\\temp', // root folder for the consumer to execute jobs
  killAt: moment().add(3, 'seconds'), // when to kill the provider
  restartAt: moment().add(7, 'seconds'), // when to restart the provider
  stopAt: moment().add(20, 'seconds'), // when to stop the whole test and check results
  */
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
  /*
  if (moment().isAfter(config.stopAt)) {
    const diff = _.difference(produced, consumed);
    console.log('Produced: ' + produced.length + ', Consumed: ' + consumed.length + ', Lost: ' + diff.length);
    console.log('*** Stop producing ***');
    config.j.cancel();
    return;
  }

  if (moment().isAfter(config.killAt) && !config.killed) {
    console.log('*** Kill rabbitMQ Now! ***');
    config.killed = true;
  }

  if (moment().isAfter(config.restartAt) && !config.restarted) {
    console.log('*** Restart rabbitMQ Now! ***');
    config.restarted = true;
  }
  */

  config.current++;
  if (config.current > messages.length - 1) {
    console.log('No more messages to produce');
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
    console.error('Producer => Can\'t produce message: ', err);
  });
}

config.j = scheduler.scheduleJob(config.cron, function() {
  doSchedule();
});
