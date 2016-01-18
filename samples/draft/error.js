var amqp = require('amqplib');
amqp.connect().then(function() {
  throw new Error('SNAFU');
}, function(err) {
  console.error('1 => Connect failed: %s', err);
}).then(null, function(err) {
  console.error('2 => Connect succeeded, but error thrown: %s', err);
});

amqp.connect().then(function() {
  throw new Error('SNAFU');
}).catch(function(err) {
  console.error('3 => ', err);
});