'use strict';

const config = {
  'bricks': [
//------------------------------------------------------------------------
    {
      'name': 'receiver',
      'module': 'cta-io',
      'properties': {
        'inputQueue': 'receiver.queue',
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
          'topic': 'receiver.to.broker',
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
          'topic': 'broker.to.receiver',
          'data': [
            {
              'nature': {
                'type': 'execution',
                'quality': 'acknowledge',
              },
            },
          ],
        },
      ],
    },
//------------------------------------------------------------------------
    {
      'name': 'broker',
      'module': '../../cta-flowcontrol-sample/samples/io/broker.js',
      'properties': {},
      'subscribe': [
        {
          'topic': 'receiver.to.broker',
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
          'topic': 'broker.to.receiver',
          'data': [
            {
              'nature': {
                'type': 'execution',
                'quality': 'acknowledge',
              },
            },
          ],
        },
        {
          'topic': 'broker.to.sender',
          'data': [{
            'nature': {
              'type': 'execution',
              'quality': 'result',
            },
          }],
        },
      ],
    },
//------------------------------------------------------------------------
    {
      'name': 'sender',
      'module': 'cta-io',
      'properties': {
        'outputQueue': 'io.sample.output.queue',
        'provider': {
          'name': 'rabbitmq',
          'options': {
            'url': 'amqp://localhost',
          },
        },
      },
      'subscribe': [
        {
          'topic': 'broker.to.sender',
          'data': [{
            'nature': {
              'type': 'execution',
              'quality': 'result',
            },
          }],
        },
      ],
    },
//------------------------------------------------------------------------
  ],
};

module.exports = config;
