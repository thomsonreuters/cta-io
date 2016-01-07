// consume a job
const q = require('q');
const SqrLib = require('../lib');
// const sqr = new SqrLib('rabbitmq');
const sqr = new SqrLib('wampkue');

function cb(json) {
  const deferred = q.defer();
  console.log('\nReceived new job: ', json);
  // adding timeout to simulate job running
  setTimeout(function() {
    console.log('\nJob done');
    deferred.resolve();
  }, 2000);
  return deferred.promise;
}

sqr.consume({
  queue: 'test',
  cb: cb,
}).then(function() {
  console.log('\nConsumed new job');
}, function(err) {
  console.error(err);
});
