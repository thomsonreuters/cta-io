// subscribe to events
const SqrLib = require('../lib');
// const sqr = new SqrLib('rabbitmq');
const sqr = new SqrLib('wampkue');

function cb(json) {
  console.log('\nReceived new message: ', json);
}

sqr.subscribe({
  key: 'test_key',
  cb: cb,
}).then(function() {
  console.log('\nSubscribed');
}, function(err) {
  console.error('\nCan\'t subscribe: ', err);
});
