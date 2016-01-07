// publish events
const SqrLib = require('../lib');

const provider = process.argv.slice(2).join() || 'rabbitmq';
console.log('Using provider "' + provider + '"');
const sqr = new SqrLib(provider);

const json = {
  id: '123',
  status: 'ok',
  description: 'simple test',
};

sqr.publish({
  key: 'test_key',
  json: json,
}).then(function() {
  console.log('\nPublished');
}, function(err) {
  console.error('\nCan\'t publish: ', err);
});