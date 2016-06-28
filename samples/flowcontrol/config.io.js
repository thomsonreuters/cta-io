'use strict';
const os = require('os');
const path = require('path');
const config = {
  io: {
    main: {
      provider: 'rabbitmq',
      url: 'amqp://localhost',
    },
    recovery: {
      provider: 'rabbitmq',
      url: 'amqp://localhost',
    },
  },
  bricks: [
//------------------------------------------------------------------------
    {
      name: 'Receiver',
      module: 'cta-io',
      properties: {
        connection: 'main',
        inputQueue: 'input.queue',
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
      name: 'Broker',
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
      name: 'MainSender',
      module: 'cta-io',
      properties: {
        connection: 'main',
        outputQueue: 'output.queue',
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
      name: 'Silo',
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
          topic: 'deferred.com',
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
      name: 'DeferredSender',
      module: 'cta-io',
      properties: {
        connection: 'recovery',
        outputQueue: 'output.deferred',
      },
      subscribe: [
        {
          topic: 'deferred.com',
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
