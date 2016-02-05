'use strict';

const amqp = require('amqplib/callback_api');
const events = require('events');
const EventEmitter = events.EventEmitter;

const validate = require('../../validate/');

class RQProvider extends EventEmitter {
  /**
   * Create a new RQProvider instance
   * @param {object} params - object parameters
   * @param {string} params.url - rabbitMQ host
   */
  constructor(params) {
    super();
    const self = this;
    const p = validate(params, {
      url: {
        optional: true,
        type: 'string',
        defaultTo: 'amqp://localhost?heartbeat=60',
      },
    });
    self.url = p.url;

    self.reconnecting = false;
    self.interval = null;
    self.connection = null;
    self.channel = null;

    self.extra = {
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
  }

  _reconnect() {
    const self = this;
    if (self.reconnecting === true) {
      console.log('*** already reconnecting...');
      return;
    }
    self.reconnecting = true;
    self.interval = setInterval(function() {
      self.connect(true)
        .then(function() {
          clearInterval(self.interval);
          self.emit('reconnected');
          self.reconnecting = false;
        });
    }, 2000);
  }

  connect(force) {
    const self = this;
    return new Promise((resolve, reject) => {
      if (force !== true && self.connection && self.channel) {
        return resolve(self.channel);
      }
      console.log('*** Connecting to rabbitMQ...');
      amqp.connect(self.url, function(connErr, connection) {
        if (connErr) {
          console.log('*** rabbitMQ connection error');
          self._reconnect();
          reject(connErr);
        } else {
          connection.on('close', function() {
            console.log('*** connection close event');
            self._reconnect();
          });
          connection.on('error', function(err) {
            console.log('*** connection error event: ', err);
          });
          self.connection = connection;
          connection.createConfirmChannel(function(chErr, channel) {
            if (chErr) {
              reject(chErr);
            } else {
              channel.on('close', function() {
                console.log('*** channel close event');
              });
              channel.on('error', function(err) {
                console.log('*** channel error event: ', err);
              });
              self.channel = channel;
              resolve(self.channel);
            }
          });
        }
      });
    });
  }

  /**
   * Convert buffer to json
   * @param {buffer} buffer - the buffer to convert
   * @return {object} - the converted buffer as json
   */
  _bufferToJSON(buffer) {
    return JSON.parse(buffer.toString());
  }

  /**
   * Convert json to buffer
   * @param {object} - the json to convert
   * @return {object} buffer - the converted json as buffer
   */
  _jsonToBuffer(json) {
    return new Buffer(JSON.stringify(json));
  }

  /**
   * Produce a message in a queue
   * @param {object} channel - rabbitMQ channel
   * @param {object} params - object parameters
   * @param {string} params.queue - the queue name where to produce the message
   * @param {object} params.json - the message to produce as json
   * @param {object} params.extra - rabbitMQ extra parameters
   * @param {boolean} params.extra.mq_persistent - rabbitMQ durable parameter
   * @param {boolean} params.extra.mq_durable - rabbitMQ persistent parameter
   * @return {object} - promise
   */
  produce(channel, params) {
    const self = this;
    try {
      channel.assertQueue(params.queue, {durable: params.extra.mq_durable});
      channel.sendToQueue(params.queue, self._jsonToBuffer(params.json), {persistent: params.extra.mq_persistent});
      console.log('RabbitMQProvider => Produced new message: ', params.json);
      return Promise.resolve('ok');
    } catch (e) {
      return Promise.reject(e.message);
    }
  }

  /**
   * Consume a message from a queue
   * @param {object} channel - rabbitMQ channel
   * @param {object} params - object parameters
   * @param {string} params.queue - the queue name where to produce the message
   * @param {function} params.cb - callback function to run after consuming a message
   * @param {object} params.extra - rabbitMQ extra parameters
   * @param {boolean} params.extra.mq_noAck - rabbitMQ noAck parameter
   * @param {boolean} params.extra.mq_prefetch - rabbitMQ prefetch parameter
   * @param {boolean} params.extra.mq_durable - rabbitMQ durable parameter
   * @return {object} - promise
   */
  consume(channel, params) {
    const self = this;
    return new Promise((resolve, reject) => {
      try {
        channel.assertQueue(params.queue, {durable: params.extra.mq_durable});
        channel.prefetch(params.extra.mq_prefetch);
        console.log('RabbitMQProvider => Waiting for messages in queue "%s"', params.queue);
        channel.consume(params.queue, function(msg) {
          const json = self._bufferToJSON(msg.content);
          const res = params.cb(json);
          if (res instanceof Promise) {
            res.then(function() {
              self.channel.ack(msg);
              console.log('acknowledged message: ', json);
            }, function(err) {
              console.error(err);
            });
          } else {
            self.channel.ack(msg);
            console.log('acknowledged message: ', json);
          }
        }, {noAck: params.extra.mq_noAck});
        resolve('ok');
      } catch (e) {
        reject(e.message);
      }
    });
  }

  /**
   * Publish a message to a chanel
   * @param {object} channel - rabbitMQ channel
   * @param {object} params - object parameters
   * @param {string} params.key - the chanel key name where to publish the message
   * @param {object} params.json - the message to publish in json format
   * @param {object} params.extra - rabbitMQ extra parameters
   * @param {boolean} params.extra.mq_ex_name - rabbitMQ exchange name
   * @param {boolean} params.extra.mq_ex_type - rabbitMQ exchange type
   * @param {boolean} params.extra.mq_durable - rabbitMQ durable parameter
   * @return {object} - promise
   */
  publish(channel, params) {
    const self = this;
    try {
      channel.assertExchange(params.extra.mq_ex_name, params.extra.mq_ex_type, {durable: params.extra.mq_durable});
      channel.publish(params.extra.mq_ex_name, params.key, self._jsonToBuffer(params.json));
      console.log('RabbitMQProvider => Published new message: ', params.json);
      return Promise.resolve('ok');
    } catch (e) {
      return Promise.reject(e.message);
    }
  }

  /**
   * Subscribe to messages from a chanel
   * @param {object} channel - rabbitMQ channel
   * @param {object} params - object parameters
   * @param {string} params.key - the chanel key name where to listen to messages
   * @param {function} params.cb - callback function to run after receiving a message, it takes the received json msg as a param
   * @param {object} params.extra - rabbitMQ extra parameters
   * @param {boolean} params.extra.mq_ex_name - rabbitMQ exchange name
   * @param {boolean} params.extra.mq_ex_type - rabbitMQ exchange type
   * @param {boolean} params.extra.mq_durable - rabbitMQ durable parameter
   * @return {object} - promise
   */
  subscribe(channel, params) {
    const self = this;
    return new Promise((resolve, reject) => {
      channel.assertExchange(params.extra.mq_ex_name, params.extra.mq_ex_type, {durable: params.extra.mq_durable});
      channel.assertQueue(params.key, {exclusive: false}, function(assertErr, queue) {
        if (assertErr) {
          return reject(assertErr);
        }
        console.log('RabbitMQProvider => Subscribed, waiting for messages...');
        channel.bindQueue(queue.queue, params.extra.mq_ex_name, params.key);
        channel.consume(queue.queue, function(msg) {
          const json = self._bufferToJSON(msg.content);
          console.log('RabbitMQProvider => Consuming new message: ', json);
          const res = params.cb(json);
          if (res instanceof Promise) {
            res.then(function() {
              self.channel.ack(msg);
              console.log('acknowledged message: ', json);
            }, function(err) {
              console.error(err);
            });
          } else {
            channel.ack(msg);
            console.log('acknowledged message: ', json);
          }
        }, {noAck: params.extra.mq_noAck});
        resolve('ok');
      });
    });
  }

}

exports = module.exports = RQProvider;
