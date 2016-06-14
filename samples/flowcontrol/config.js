'use strict';
const os = require('os');
const path = require('path');
const config = {
  'bricks': [
//------------------------------------------------------------------------
    {
      name: 'receiver',
      module: 'cta-io',
      properties: {
        providerName: 'rabbitmq',
        parameters: {
          url: 'amqp://localhost',
          inputQueue: 'input.queue',
        },
      },
      publish: [
        {
          'topic': 'topics.com',
          'data': [{
            'nature': {
              'type': 'execution',
              'quality': 'commandline',
            },
          }],
        },
      ],
    },
//------------------------------------------------------------------------
    {
      name: 'broker',
      module: '../../cta-io/samples/flowcontrol/broker.js',
      properties: {},
      subscribe: [
        {
          'topic': 'topics.com',
          'data': [{
            'nature': {
              'type': 'execution',
              'quality': 'commandline',
            },
          }],
        },
      ],
      publish: [
        {
          'topic': 'topics.com',
          'data': [
            {
              'nature': {
                'type': 'execution',
                'quality': 'result',
              },
            },
          ],
        },
      ],
    },
//------------------------------------------------------------------------
    {
      name: 'sender',
      module: 'cta-io',
      properties: {
        providerName: 'rabbitmq',
        parameters: {
          url: 'amqp://localhost',
          outputQueue: 'output.queue',
        },
      },
      subscribe: [
        {
          topic: 'topics.com',
          data: [
            {
              nature: {
                type: 'execution',
                quality: 'result',
              },
            },
          ],
        },
      ],
      publish: [
        {
          topic: 'topics.com',
          data: [
            {
              nature: {
                type: 'teststatus',
                quality: 'save',
              },
            },
            {
              nature: {
                type: 'teststatus',
                quality: 'read',
              },
            },
          ],
        },
      ],
    },
//------------------------------------------------------------------------
    {
      name: 'silo',
      module: 'cta-silo',
      properties: {
        provider: {
          name: 'nedb',
          options: {
            filename: os.tmpDir() + path.sep + 'silo.db',
          },
        },
      },
      publish: [
        {
          topic: 'deferred.results',
          data: [
            {
              nature: {
                type: 'execution',
                quality: 'result',
              },
            },
          ],
        },
      ],
      subscribe: [
        {
          topic: 'topics.com',
          data: [
            {
              nature: {
                type: 'teststatus',
                quality: 'save',
              },
            },
            {
              nature: {
                type: 'teststatus',
                quality: 'read',
              },
            },
          ],
        },
      ],
    },
//------------------------------------------------------------------------
    {
      name: 'recovery',
      module: 'cta-io',
      properties: {
        providerName: 'rabbitmq',
        parameters: {
          url: 'amqp://localhost',
          outputQueue: 'output.failed',
          reconnectAfter: 5000,
        },
      },
      subscribe: [
        {
          topic: 'deferred.results',
          data: [
            {
              nature: {
                type: 'execution',
                quality: 'result',
              },
            },
          ],
        },
      ],
      publish: [
        {
          topic: 'topics.com',
          data: [
            {
              nature: {
                type: 'teststatus',
                quality: 'save',
              },
            },
            {
              nature: {
                type: 'teststatus',
                quality: 'read',
              },
            },
          ],
        },
      ],
    },
//------------------------------------------------------------------------
  ],
};

module.exports = config;
