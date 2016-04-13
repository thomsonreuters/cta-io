# CTA-IO

Send, receive & queue module for CTA Opensource projects

## How to use it

Require lib

````javascript
const IoLib = require('./lib');
````

### Choose a provider

#### RabbitMQ provider

Default options

````javascript
const IoLib = require('./lib');
const provider = new IoLib('rabbitmq');
````

Custom options

````javascript
const IoLib = require('./lib');
const provider = new IoLib('rabbitmq', {url: 'amqp://my.mq.host'});
````

This provider uses amqplib node module

Refer to https://www.rabbitmq.com/ to get a working rabbitMQ environment.

### Produce

````javascript
// produce message
const IoLib = require('../../lib');

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

see samples/simple/produce.js

### Consume

````javascript
// consume message
const IoLib = require('../../lib');

const provider = process.argv.slice(2).join() || 'rabbitmq';
console.log('Using provider "' + provider + '"');

const io = new IoLib(provider);

function cb(json) {
  return new Promise((resolve) => {
    console.log('Received new message: ', json);
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

see samples/simple/consume.js

### Subscribe

````javascript
'use strict';

// subscribe to receive messages
const IoLib = require('../../lib');

const provider = process.argv.slice(2).join() || 'rabbitmq';
console.log('Using provider "' + provider + '"');

const io = new IoLib(provider);

function cb(json) {
  return new Promise((resolve) => {
    console.log('Received new message: ', json);
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

see samples/simple/subscribe.js

### Publish

````javascript
'use strict';

// publish message
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

see samples/simple/publish.js