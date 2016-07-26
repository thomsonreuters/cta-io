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
