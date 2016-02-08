'use strict';

const assert = require('chai').assert;
const SqrLib = require('../../../lib/index.js');

const validations = [
  {
    method: 'produce',
    params: {
      queue: 'test',
      json: {a: 1, b: 2},
      extra: {
        mq_persistent: 123,
        mq_durable: 'abc',
      },
    },
  },

  {
    method: 'consume',
    params: {
      queue: 'test',
      cb: function() { return true; },
      extra: {
        mq_noAck: 123,
        mq_prefetch: 'abc',
        mq_durable: 'abc',
      },
    },
  },

  {
    method: 'subscribe',
    params: {
      key: 'test_key',
      cb: function() { return true; },
      extra: {
        mq_ex_name: 123,
        mq_ex_type: 123,
        mq_durable: 'abc',
        mq_noAck: 'abc',
      },
    },
  },

  {
    method: 'publish',
    params: {
      key: 'test_key',
      json: {a: 1, b: 2},
      extra: {
        mq_ex_name: 123,
        mq_ex_type: 123,
        mq_durable: 123,
      },
    },
  },
];

describe('RabbitMQ extra params validation', function() {
  validations.forEach(function(test) {
    it('reject ' + test.method + ' with wrong extra params types', function(done) {
      const sqr = new SqrLib('rabbitmq');
      sqr[test.method](test.params)
        .then(function(data) {
          console.log('data: ', data);
          done('error');
        }, function(err) {
          console.log('err: ', err);
          assert.include(err, 'validate module => invalid parameter type');
          done();
        });
    });
  });
});
