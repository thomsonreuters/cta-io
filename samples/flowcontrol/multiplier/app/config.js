'use strict';

module.exports = {
  name: 'io sample',
  tools: [{
    name: 'logger',
    module: 'cta-logger',
    properties: {
      level: 'silly',
    },
    scope: 'all',
    singleton: true,
  }, {
    name: 'messaging',
    module: 'cta-messaging',
    properties: {
      provider: 'rabbitmq',
      parameters: {
        url: 'amqp://localhost?heartbeat=60',
      },
    },
    singleton: true,
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
