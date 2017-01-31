'use strict';

const path = require('path');
const os = require('os');
const siloFilename = path.join(os.tmpDir(), 'sample.db');

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
    module: './producer.js',
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
          type: 'documents',
          quality: 'backup',
        },
      }, {
        nature: {
          type: 'documents',
          quality: 'restore',
        },
      }],
    }],
  }, {
    name: 'silo',
    module: 'cta-silo',
    properties: {
      filename: siloFilename,
    },
    subscribe: [{
      topic: 'documents.com',
      data: [{
        nature: {
          type: 'documents',
          quality: 'backup',
        },
      }, {
        nature: {
          type: 'documents',
          quality: 'restore',
        },
      }, {
        nature: {
          type: 'documents',
          quality: 'clear',
        },
      }],
    }],
  }],
};
