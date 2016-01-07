// consume a job
const q = require('q');
const SqrLib = require('../lib');

const provider = process.argv.slice(2).join() || 'rabbitmq';
console.log('Using provider "' + provider + '"');
const sqr = new SqrLib(provider);

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
