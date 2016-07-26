CTA-IO
========

This is the Input/Output Brick for cta project

First refer to cta-brick and cta-flowcontrol repositories to familiarize yourself with those concepts.

Like all bricks, IO Brick can be easily injected into a flowcontrol using a configuration

# Brick properties

* dependencies: this brick depends on cta-messaging tool to read & write to/from the outside. If it's not specified, it will use the default one. Refer to cta-messaging doc.
* inputQueue: this is the name of the queue where to read from as soon as the application is initialized.
  Read methods can be "subscribe" (default) or "consume". Refer to [cta-messaging tool](/lib/io/README.md) doc to read more about these methods
  Received messages are published in the channel according to the publish configuration.
* inputMethod: "subscribe" (default) or "consume"
* outputQueue: this is the name of the default output queue where to write to

Note that this brick can be used as a Receiver (Input) and/or a Sender (Output)

# Sample

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
      inputQueue: 'input.queue',
    },
    publish: [{
      topic: 'topics.com',
      data: [{}],
    }],
  }, {
    name: 'Sender',
    module: 'cta-io',
    dependencies: {
      messaging: 'messaging',
    },
    properties: {
      outputQueue: 'output.queue',
    },
    subscribe: [{
      topic: 'topics.com',
      data: [{}],
    }],
  }],
};
````

See /samples/flowcontrol/shortcut/

