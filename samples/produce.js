// produce a job
const SqrLib = require('../lib/');
const provider = new SqrLib.rabbitMQProvider();
const sqr = new SqrLib(provider);

sqr.produce({
  queue: 'test',
  json: {
    job: 'run command',
    cmd: 'ls',
  },
}).then(function() {
  console.log('Produced new job');
}, function(err) {
  console.error('Can\'t produce new job: ', err);
});
