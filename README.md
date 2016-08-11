CTA-IO
========

This is the Input/Output Brick for cta project

First refer to cta-brick and cta-flowcontrol repositories to familiarize yourself with those concepts.

Like all bricks, IO Brick can be easily injected into a flowcontrol using a configuration

# Brick dependencies

This brick depends on cta-messaging tool to read & write to/from the outside.
 
If it's not specified, it will use the default one. Refer to cta-messaging doc.

Refer to [cta-messaging tool](/lib/io/README.md) documentation to read more about this Tool

# Brick properties

* input.queue & input.topic: this is the name of the default queue/topic where to consume from as soon as the application is started.
  Received messages are then automatically published in the channel according to the publish configuration of the brick
* output.queue & output.topic: this is the name of the default queue/topic where to write to

Note that this brick can be used as a Receiver (Input) and/or a Sender (Output)

# Brick contracts

| nature.type | nature.quality | payload
| --- | --- | ---
| message | produce | { queue: string, message: * }
| message | consume | { queue: string, prefetch: number }
| message | get | { queue: string }
| message | publish | { topic: string, message: * }
| message | subscribe | { topic: string }
| message | acknowledge | { id: * }

# Configuration sample

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
      topic: 'topics.com',
      data: [{}],
    }],
  }, {
    name: 'Sender',
    module: 'cta-io',
    dependencies: {
      messaging: 'messaging',
    },
    properties: {},
    subscribe: [{
      topic: 'topics.com',
      data: [{}],
    }],
  }],
};
````

See a full working sample in /samples/flowcontrol/

