// subscribe to events
const q = require('q');
const SqrLib = require('../lib/');
const provider = new SqrLib.rabbitMQProvider();
const sqr = new SqrLib(provider);

function cb(json) {
  console.log('\nReceived new event: ', json);
}

sqr.subscribe({
  ex: 'test_ex',
  key: 'test_key',
  cb: cb,
}).then(function() {
  console.log('Subscribed');
}, function(err) {
  console.error('Can\'t subscribe: ', err);
});
