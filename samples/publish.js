// publish events
const SqrLib = require('../lib');
// const sqr = new SqrLib('rabbitmq');
const sqr = new SqrLib('wampkue');

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