'use strict';

const config = {
  'bricks': [
//------------------------------------------------------------------------
    {
      'name': 'io',
      'module': 'cta-io',
      'properties': {
        'inputQueue': 'receiver.queue',
        'outputQueue': 'io.sample.output.queue',
        'provider': {
          'name': 'rabbitmq',
          'options': {
            'url': 'amqp://localhost',
          },
        },
        start: {
          method: 'consume',
          params: {
            queue: 'io.sample.input.queue',
            ack: 'auto',
          },
        },
      },
      'publish': [
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
      'subscribe': [
        {
          'topic': 'topics.com',
          'data': [
            {
              'nature': {
                'type': 'execution',
                'quality': 'acknowledge',
              },
            },
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
      'name': 'broker',
      'module': '../../cta-io/samples/flowcontrol/broker.js',
      'properties': {},
      'subscribe': [
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
      'publish': [
        {
          'topic': 'topics.com',
          'data': [
            {
              'nature': {
                'type': 'execution',
                'quality': 'acknowledge',
              },
            },
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
  ],
};

module.exports = config;
