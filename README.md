# SQR (Send-Queue-Receive)

Send, receive & queue brick for CTA project

## How to use it

Require lib

````javascript
const SqrLib = require('./lib/');
````

### Choose a provider

#### RabbitMQ provider

````javascript
const provider = new SqrLib.rabbitMQProvider();
````
This provider uses amqplib node module

Refer to https://www.rabbitmq.com/ to get a working rabbitMQ environment.

#### WampKue provider

````javascript
const provider = new SqrLib.wampKueProvider();
````

This provider uses node modules kue (for produce & consume methods) and autobahn (for publish & subscribe methods)

Kue module needs Redis backend, refer to http://redis.io/ to get a working environment

Autobahn module uses WAMP protocol over crossbar.io, refer to http://crossbar.io/ to get a working environment
  
### Produce a job

see samples/produce.js

### Consume a job

see samples/consume.js

### Subscribe to events
                        
see samples/subscribe.js

### Publish events

see samples/publish.js