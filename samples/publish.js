// subscribe to events
const q = require('q');
const SqrLib = require('../lib/');
const provider = new SqrLib.rabbitMQProvider();
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
  console.log('Published');
}, function(err) {
  console.error('Can\'t publish: ', err);
});