'use strict';

exports = module.exports = {
  produce: {
    extra_pattern: {
      mq_persistent: {
        optional: true,
        type: 'boolean',
        defaultTo: true,
      },
      mq_durable: {
        optional: true,
        type: 'boolean',
        defaultTo: true,
      },
    },
  },

  consume: {
    mq_noAck: {
      optional: true,
      type: 'boolean',
      defaultTo: false,
    },
    mq_prefetch: {
      optional: true,
      type: 'number',
      defaultTo: 1,
    },
    mq_durable: {
      optional: true,
      type: 'boolean',
      defaultTo: true,
    },
  },

  publish: {
    mq_ex_name: {
      optional: true,
      type: 'string',
      defaultTo: 'default',
    },
    mq_ex_type: {
      optional: true,
      type: 'string',
      defaultTo: 'topic',
    },
    mq_durable: {
      optional: true,
      type: 'boolean',
      defaultTo: true,
    },
  },

  subscribe: {
    mq_ex_name: {
      optional: true,
      type: 'string',
      defaultTo: 'default',
    },
    mq_ex_type: {
      optional: true,
      type: 'string',
      defaultTo: 'topic',
    },
    mq_durable: {
      optional: true,
      type: 'boolean',
      defaultTo: true,
    },
    mq_noAck: {
      optional: true,
      type: 'boolean',
      defaultTo: false,
    },
  },
};
