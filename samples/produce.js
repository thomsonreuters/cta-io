// produce a job
const SqrLib = require('../lib');
// const sqr = new SqrLib('rabbitmq');
const sqr = new SqrLib('wampkue');

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
