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
        reConnectAfter: 5000,
      },
    },
    singleton: true,
  }],
  bricks: [{
    name: 'producer',
    module: '../../cta-io/samples/flowcontrol/silo/producer.js',
    properties: {},
    publish: [{
      topic: 'produce.com',
      data: [{}],
    }],
  }, {
    name: 'io',
    module: 'cta-io',
    dependencies: {
      messaging: 'messaging',
    },
    properties: {
      output: {
        queue: 'output.sample',
      },
    },
    subscribe: [{
      topic: 'produce.com',
      data: [{}],
    }],
    publish: [{
      topic: 'documents.com',
      data: [{
        nature: {
          type: 'document',
          quality: 'backup',
        },
      }, {
        nature: {
          type: 'document',
          quality: 'restore',
        },
      }],
    }],
  }, {
    name: 'silo',
    module: 'cta-silo',
    properties: {
      filename: require('os').tmpDir() + require('path').sep + 'sample.db',
    },
    subscribe: [{
      topic: 'documents.com',
      data: [{
        nature: {
          type: 'document',
          quality: 'backup',
        },
      }, {
        nature: {
          type: 'document',
          quality: 'restore',
        },
      }, {
        nature: {
          type: 'document',
          quality: 'clear',
        },
      }],
    }],
  }],
};
