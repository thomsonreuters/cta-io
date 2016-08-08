Multiplier sample
=================

This is a basic flowcontrol application sample that illustrate how to use cta-io brick.

It receive jobs from an external service 'Producer', process them and send results to another external service 'Consumer'

{ Producer } -> { Flowcontrol App } -> { Consumer }

In order to communicate with external services, it use cta-messaging tool as a dependency of cta-io brick

# Application configuration

````javascript
'use strict';
module.exports = {
  tools: [{
    name: 'messaging',
    module: 'cta-messaging',
    properties: {
      provider: 'rabbitmq',
      parameters: {
        url: 'amqp://localhost?heartbeat=60',
      },
    },
  }],
  bricks: [{
    name: 'Receiver',
    module: 'cta-io',
    dependencies: {
      messaging: 'messaging',
    },
    properties: {
      input: {
        queue: 'input.queue',
      },
    },
    publish: [{
      topic: 'multiplier.do',
      data: [{}],
    }],
  }, {
    name: 'Multiplier',
    module: '../../cta-io/samples/flowcontrol/multiplier/app/multiplier.js',
    properties: {},
    subscribe: [{
      topic: 'multiplier.do',
      data: [{}],
    }],
    publish: [{
      topic: 'multiplier.result',
      data: [{}],
    }],
  }, {
    name: 'Sender',
    module: 'cta-io',
    dependencies: {
      messaging: 'messaging',
    },
    properties: {
      output: {
        queue: 'output.queue',
      },
    },
    subscribe: [{
      topic: 'multiplier.result',
      data: [{}],
    }],
  }],
};

````

In this configuration, we use one Tool, 2 cta-io bricks, one as a Receiver and another one as a Sender
 
We also use a custom brick Multiplier that process jobs

A job consists of doing the multiplication of 2 numbers x & y.

The producer generates 2 random numbers x & y (eg. x=4, y=3) and push them into a queue using cta-messaging.

The flowcontrol app consume jobs from this queue via it's Receiver Brick

# How to use it

First, run the flowcontrol app

````javascript
node app;
````

You should see that both Receiver & Sender Bricks are initialized. Also, the Receiver Brick is waiting for messages in a queue 'input.queue'

Then, run the Consumer Service

````javascript
node consumer;
````

You should see that the Consumer is waiting for jobs results in a queue 'output.queue' to consume them and display them in the console

Now, run the Producer Service

````javascript
node producer;
````

You should see that the Producer is producing some jobs (2 random numbers x & y) in the queue 'input.queue'

The flowcontrol app, receives those jobs via the Receiver Brick and publish them in the flowcontrol channel in a topic "multiplier.do"

The Multiplier Brick receives the job and do the multiplication of x & y

Then it publishes the multiplication result in the channel topic "multiplier.result"

The Sender Brick receive the result and produce it in the queue 'output.queue'

The Consumer Service receive the job result from the flowcontrol app and log it to the console.