'use strict';

const q = require('q');
const amqp = require('amqplib/callback_api');
const validate = require('../validate/');

const config = {};

const tools = {
  /**
   * Execute a callback function after parameters validation
   * @param {object} params - object parameters
   * @param {object} pattern - validation pattern for params
   * @param {function} cb - callback function that accepts 2 params: ch (rabbitMQ channel) & conn (rabbitMQ connection)
   * @return {object} - promise
   */
  exec: function(params, pattern, cb) {
    const deferred = q.defer();
    if (params && pattern) {
      // common params are validated in Sqr class, here we validate extra params only if provided
      const res = validate(params.extra, pattern);
      if (res !== true) {
        deferred.reject(res);
        return deferred.promise;
      }
    }
    amqp.connect(config.url, function(connErr, conn) {
      if (connErr) {
        deferred.reject(connErr);
      } else {
        conn.createChannel(function(chErr, ch) {
          if (chErr) {
            deferred.reject(chErr);
          } else {
            cb(ch, conn, params)
              .then(function(data) {
                deferred.resolve(data);
              }, function(err) {
                deferred.reject(err);
              });
          }
        });
      }
    });
    return deferred.promise;
  },

  /**
   * Convert buffer to json
   * @param {buffer} buffer - the buffer to convert
   * @return {object} - the converted buffer as json
   */
  bufferToJSON: function(buffer) {
    return JSON.parse(buffer.toString());
  },

  /**
   * Convert json to buffer
   * @param {object} - the json to convert
   * @return {object} buffer - the converted json as buffer
   */
  jsonToBuffer: function(json) {
    return new Buffer(JSON.stringify(json));
  },
};

class RQProvider {
  /**
   * Create a new RQProvider instance
   * @param {object} params - object parameters
   * @param {string} params.url - rabbitMQ host
   */
  constructor(params) {
    config.url = (params && 'url' in params) ? params.url : 'amqp://localhost';
  }

  /**
   * Produce a message in a queue
   * @param {object} params - object parameters
   * @param {string} params.queue - the queue name where to produce the message
   * @param {object} params.json - the message to produce as json
   * @param {object} params.extra - rabbitMQ extra parameters
   * @param {boolean} params.extra.mq_persistent - rabbitMQ durable parameter
   * @param {boolean} params.extra.mq_durable - rabbitMQ persistent parameter
   * @return {object} - promise
   */
  produce(params) {
    const pattern = {
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
    };

    function cb(ch, conn, input) {
      const deferred = q.defer();
      ch.assertQueue(input.queue, {durable: input.extra.mq_durable});
      ch.sendToQueue(input.queue, tools.jsonToBuffer(input.json), {persistent: input.extra.mq_persistent});
      console.log('\nProduced new message: ', input.json);
      setTimeout(function() {
        conn.close();
        deferred.resolve();
      }, 500);
      return deferred.promise;
    }

    return tools.exec(params, pattern, cb);
  }

  /**
   * Consume a message from a queue
   * @param {object} params - object parameters
   * @param {string} params.queue - the queue name where to produce the message
   * @param {function} params.cb - callback function to run after consuming a message
   * @param {object} params.extra - rabbitMQ extra parameters
   * @param {boolean} params.extra.mq_noAck - rabbitMQ noAck parameter
   * @param {boolean} params.extra.mq_prefetch - rabbitMQ prefetch parameter
   * @param {boolean} params.extra.mq_durable - rabbitMQ durable parameter
   * @return {object} - promise
   */
  consume(params) {
    const pattern = {
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
    };

    function cb(ch, conn, input) {
      const deferred = q.defer();
      ch.assertQueue(input.queue, {durable: input.extra.mq_durable});
      ch.prefetch(input.extra.mq_prefetch);
      console.log('\nWaiting for messages in queue "%s"', input.queue);
      ch.consume(input.queue, function(msg) {
        const json = tools.bufferToJSON(msg.content);
        input.cb(json)
          .then(function(data) {
            ch.ack(msg);
            deferred.resolve(data);
          }, function(err) {
            deferred.reject(err);
          });
      }, {noAck: input.extra.mq_noAck});
      return deferred.promise;
    }

    return tools.exec(params, pattern, cb);
  }

  /**
   * Publish a message to a chanel
   * @param {object} params - object parameters
   * @param {string} params.key - the chanel key name where to publish the message
   * @param {object} params.json - the message to publish in json format
   * @param {object} params.extra - rabbitMQ extra parameters
   * @param {boolean} params.extra.mq_ex_name - rabbitMQ exchange name
   * @param {boolean} params.extra.mq_ex_type - rabbitMQ exchange type
   * @param {boolean} params.extra.mq_durable - rabbitMQ durable parameter
   * @return {object} - promise
   */
  publish(params) {
    const pattern = {
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
        defaultTo: false,
      },
    };

    function cb(ch, conn, input) {
      const deferred = q.defer();
      ch.assertExchange(input.extra.mq_ex_name, input.extra.mq_ex_type, {durable: input.extra.mq_durable});
      ch.publish(input.extra.mq_ex_name, input.key, tools.jsonToBuffer(input.json));
      console.log('\nPublished new message: ', input.json);
      setTimeout(function() {
        conn.close();
        deferred.resolve();
      }, 500);
      return deferred.promise;
    }

    return tools.exec(params, pattern, cb);
  }

  /**
   * Subscribe to messages from a chanel
   * @param {object} params - object parameters
   * @param {string} params.key - the chanel key name where to listen to messages
   * @param {function} params.cb - callback function to run after receiving a message, it takes the received json msg as a param
   * @param {object} params.extra - rabbitMQ extra parameters
   * @param {boolean} params.extra.mq_ex_name - rabbitMQ exchange name
   * @param {boolean} params.extra.mq_ex_type - rabbitMQ exchange type
   * @param {boolean} params.extra.mq_durable - rabbitMQ durable parameter
   * @return {object} - promise
   */
  subscribe(params) {
    const pattern = {
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
        defaultTo: false,
      },
    };

    function cb(ch, conn, input) {
      const deferred = q.defer();
      ch.assertExchange(input.extra.mq_ex_name, input.extra.mq_ex_type, {durable: input.extra.mq_durable});
      ch.assertQueue('', {exclusive: true}, function(err, queue) {
        console.log('\nSubscribed, waiting for messages...');
        ch.bindQueue(queue.queue, input.extra.mq_ex_name, input.key);
        ch.consume(queue.queue, function(msg) {
          const json = tools.bufferToJSON(msg.content);
          console.log('\nConsuming new message: ', json);
          input.cb(json);
        }, {noAck: true});
        deferred.resolve();
      });
      return deferred.promise;
    }

    return tools.exec(params, pattern, cb);
  }

}

exports = module.exports = RQProvider;
