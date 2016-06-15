# IO Module
------------

Io module is located under folder /lib/io/

You should first require it

````javascript
const IoLib = require('./lib/io');
````

Then you can chose a provider

## IO Module Providers

### RabbitMQ provider

````javascript
const IoLib = require('./lib/io');
const provider = new IoLib('rabbitmq', {url: 'amqp://my.mq.host'});
````

This provider uses amqplib node module

Refer to https://www.rabbitmq.com/ to get a working rabbitMQ environment.

### Other providers

We have currently only one provider RabbitMQ. We will manage to provide more providers in the future:

* Kafka provider
* Http provider

## IO Module main methods

### Produce

This method produces a message in a queue for consumers to consume from.

````javascript
const IoLib = require('./lib/io');
const provider = process.argv.slice(2).join() || 'rabbitmq';
console.log('Using provider "' + provider + '"');
const io = new IoLib(provider);
io.produce({
  queue: 'test',
  json: {
    job: 'run command',
    cmd: 'ls',
  },
}).then(function(response) {
  console.log('response: ', response);
}, function(err) {
  console.error('error: ', err);
});
````

See samples/basic/produce.js

### Consume

This method registers a consumer to listen to a queue and consume messages as soon as they are produced.

A consumer will proceed with the next message in the queue only when the first message has been acknowledged.

````javascript
const IoLib = require('../../lib/io');
const provider = process.argv.slice(2).join() || 'rabbitmq';
console.log('Using provider "' + provider + '"');
const io = new IoLib(provider);
function cb(json) {
  return new Promise((resolve) => {
    // adding timeout to simulate job running
    setTimeout(function() {
      resolve(json);
    }, 500);
  });
}
io.consume({
  queue: 'test',
  cb: cb,
}).then(function(response) {
  console.log('response: ', response);
}, function(err) {
  console.error('error: ', err);
});
````

See samples/basic/consume.js

### Subscribe

This method registers a subscriber to listen to a queue in an exchange and consume messages as soon as they are produced.

Unlike a consumer, a subscriber will proceed with all messages in the queue.

````javascript
'use strict';
const IoLib = require('../../lib/io');
const provider = process.argv.slice(2).join() || 'rabbitmq';
console.log('Using provider "' + provider + '"');
const io = new IoLib(provider);
function cb(json) {
  return new Promise((resolve) => {
    resolve(json);
  });
}
io.subscribe({
  key: 'test_key',
  cb: cb,
}).then(function(response) {
  console.log('response: ', response);
}, function(err) {
  console.error('error: ', err);
});
````

See samples/basic/subscribe.js

### Publish

This method publishes a message in an exchange for subscribers to consume from.

````javascript
'use strict';
const IoLib = require('../../lib');
const provider = process.argv.slice(2).join() || 'rabbitmq';
console.log('Using provider "' + provider + '"');
const io = new IoLib(provider);
const json = {
  id: '123',
  status: 'ok',
  description: 'simple test',
};
io.publish({
  key: 'test_key',
  json: json,
}).then(function(response) {
  console.log('response: ', response);
}, function(err) {
  console.error('error: ', err);
});
````

see samples/basic/publish.js