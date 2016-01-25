# SQR (Send-Queue-Receive)

Send, receive & queue brick for CTA project

## How to use it

Require Sqr lib

````javascript
const SqrLib = require('./lib');
````

### Choose a provider

#### RabbitMQ provider

````javascript
const provider = new SqrLib('rabbitMQ');
````
This provider uses amqplib node module

Refer to https://www.rabbitmq.com/ to get a working rabbitMQ environment.

#### WampKue provider

````javascript
const provider = new SqrLib('wampkue');
````

This provider uses node modules kue (for produce & consume methods) and autobahn (for publish & subscribe methods)

Kue module needs Redis backend, refer to http://redis.io/ to get a working environment

Autobahn module uses WAMP protocol over crossbar.io, refer to http://crossbar.io/ to get a working environment
  
### Produce a job

````javascript
'use strict';

// produce message
const SqrLib = require('../../lib');

const provider = process.argv.slice(2).join() || 'rabbitmq';
console.log('Using provider "' + provider + '"');

const sqr = new SqrLib(provider);

sqr.produce({
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

### Consume a job

````javascript
'use strict';

// consume message
const SqrLib = require('../../lib');

const provider = process.argv.slice(2).join() || 'rabbitmq';
console.log('Using provider "' + provider + '"');

const sqr = new SqrLib(provider);

function cb(json) {
  return new Promise((resolve) => {
    console.log('Received new message: ', json);
    // adding timeout to simulate job running
    setTimeout(function() {
      resolve(json);
    }, 500);
  });
}

sqr.consume({
  queue: 'test',
  cb: cb,
}).then(function(response) {
  console.log('response: ', response);
}, function(err) {
  console.error('error: ', err);
});
````

see samples/simple/consume.js

### Subscribe to events

````javascript
'use strict';

// subscribe to receive messages
const SqrLib = require('../../lib');

const provider = process.argv.slice(2).join() || 'rabbitmq';
console.log('Using provider "' + provider + '"');

const sqr = new SqrLib(provider);

function cb(json) {
  return new Promise((resolve) => {
    console.log('Received new message: ', json);
    resolve(json);
  });
}

sqr.subscribe({
  key: 'test_key',
  cb: cb,
}).then(function(response) {
  console.log('response: ', response);
}, function(err) {
  console.error('error: ', err);
});
````

see samples/simple/subscribe.js

### Publish events

````javascript
'use strict';

// publish message
const SqrLib = require('../../lib');

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
}).then(function(response) {
  console.log('response: ', response);
}, function(err) {
  console.error('error: ', err);
});
````

see samples/simple/publish.js