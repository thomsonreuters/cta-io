'use strict';

const amqp = require('amqplib/callback_api');
const events = require('events');
const _ = require('lodash');
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
    self.options = validate(params, {
      url: {
        optional: true,
        type: 'string',
        defaultTo: 'amqp://localhost?heartbeat=60',
      },
    });

    self.reconnecting = false;
    self.interval = null;
    self.reconnectAfter = 10000;
    self.connection = null;
    self.connected = false;
    self.channel = null;
  }

  _reconnect() {
    const self = this;
    if (self.reconnecting === true) {
      console.log('cta-io -> *** already reconnecting...');
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
    }, self.reconnectAfter);
  }

  connect(force) {
    const self = this;
    return new Promise((resolve, reject) => {
      if (force !== true && self.connection && self.channel) {
        return resolve(self.channel);
      }
      console.log('cta-io -> *** Connecting to rabbitMQ...');
      amqp.connect(self.options.url, function(connErr, connection) {
        if (connErr) {
          console.log('cta-io -> *** rabbitMQ connection error');
          self._reconnect();
          reject(connErr);
        } else {
          connection.on('close', function() {
            console.log('cta-io -> *** connection close event');
            self.connected = false;
            self._reconnect();
          });
          connection.on('error', function(err) {
            console.log('cta-io -> *** connection error event: ', err);
          });
          self.connection = connection;
          self.connected = true;
          connection.createConfirmChannel(function(chErr, channel) {
            if (chErr) {
              reject(chErr);
            } else {
              channel.on('close', function() {
                console.log('cta-io -> *** channel close event');
              });
              channel.on('error', function(err) {
                console.log('cta-io -> *** channel error event: ', err);
              });
              self.channel = channel;
              resolve(self.channel);
            }
          });
        }
      });
    });
  }

  healthCheck() {
    return this.connected;
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
      params.extra = validate(params.extra, {
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
      });
      channel.assertQueue(params.queue, {durable: params.extra.mq_durable});
      channel.sendToQueue(params.queue, self._jsonToBuffer(params.json), {persistent: params.extra.mq_persistent});
      console.log('cta-io -> Produced new message: ', params.json);
      return Promise.resolve('ok');
    } catch (e) {
      return Promise.reject(e);
    }
  }

  /**
   * Get a message from a queue
   * @param {object} channel - rabbitMQ channel
   * @param {object} params - object parameters
   * @param {string} params.queue - the queue name where to get the message
   * @param {function} params.cb - callback function to run after getting a message
   * @param {object} params.extra - rabbitMQ extra parameters
   * @param {boolean} params.extra.mq_noAck - rabbitMQ noAck parameter
   * @param {boolean} params.extra.mq_prefetch - rabbitMQ prefetch parameter
   * @param {boolean} params.extra.mq_durable - rabbitMQ durable parameter
   * @return {object} - promise
   */
  get(channel, params) {
    const self = this;
    return new Promise((resolve, reject) => {
      try {
        params.extra = validate(params.extra, {
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
        });
        channel.assertQueue(params.queue, {durable: params.extra.mq_durable}, function(err1, data1) {
          if (err1) {
            return reject(err1);
          }
          channel.prefetch(params.extra.mq_prefetch);
          console.log('cta-io -> Getting a message in queue "%s"', params.queue);
          channel.get(params.queue, {noAck: params.extra.mq_noAck}, function(err2, msg) {
            if (err2) {
              return reject(err2);
            }
            let json = {};
            if (!msg) {
              json = null;
            } else {
              json = self._bufferToJSON(msg.content);
            }
            const res = params.cb(json);
            if (res instanceof Promise) {
              res.then(function() {
                if (msg) {
                  self.channel.ack(msg);
                  console.log('cta-io -> acknowledged message: ', json);
                }
              }, function(err3) {
                console.error('cta-io -> ', err3);
              });
            } else {
              if (msg) {
                self.channel.ack(msg);
                console.log('cta-io -> acknowledged message: ', json);
              }
            }
            resolve(_.assign(data1, {
              json: json,
            }));
          });
        });
      } catch (e) {
        reject(e);
      }
    });
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
        params.extra = validate(params.extra, {
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
        });
        channel.assertQueue(params.queue, {durable: params.extra.mq_durable}, function(err1, data1) {
          if (err1) {
            return reject(err1);
          }
          channel.prefetch(params.extra.mq_prefetch);
          console.log('cta-io -> Waiting for messages in queue "%s"', params.queue);
          channel.consume(params.queue, function(msg) {
            const json = self._bufferToJSON(msg.content);
            const res = params.cb(json);
            if (res instanceof Promise) {
              res.then(function() {
                self.channel.ack(msg);
                console.log('cta-io -> acknowledged message: ', json);
              }, function(err3) {
                console.error('cta-io -> ', err3);
              });
            } else {
              self.channel.ack(msg);
              console.log('cta-io -> acknowledged message: ', json);
            }
          }, {noAck: params.extra.mq_noAck}, function(err2, data2) {
            if (err2) {
              return reject(err2);
            }
            resolve(_.assign(data1, data2));
          });
        });
      } catch (e) {
        reject(e);
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
    return new Promise((resolve, reject) => {
      try {
        params.extra = validate(params.extra, {
          mq_ex_name: {
            optional: true,
            type: 'string',
            defaultTo: 'cta_opensource',
          },
          mq_ex_type: {
            optional: true,
            type: 'string',
            defaultTo: 'fanout',
          },
          mq_durable: {
            optional: true,
            type: 'boolean',
            defaultTo: true,
          },
        });
        channel.assertExchange(params.key, params.extra.mq_ex_type, {durable: true, autoDelete: false});
        channel.publish(params.key, '', self._jsonToBuffer(params.json), {persistent: true}, function(err) {
          if (err) {
            console.error('cta-io -> ', err);
            reject(err);
          } else {
            console.log('cta-io -> Published new message: ', params.json);
            resolve('ok');
          }
        });
      } catch (e) {
        reject(e);
      }
    });
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
      try {
        params.extra = validate(params.extra, {
          mq_ex_name: {
            optional: true,
            type: 'string',
            defaultTo: 'cta_opensource',
          },
          mq_ex_type: {
            optional: true,
            type: 'string',
            defaultTo: 'fanout',
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
        });
        channel.assertExchange(params.key, params.extra.mq_ex_type, {durable: true, autoDelete: false});
        channel.assertQueue(params.key, {durable: true, autoDelete: false}, function(assertErr, queue) {
          if (assertErr) {
            return reject(assertErr);
          }
          console.log('cta-io -> Subscribed, waiting for messages...');
          channel.bindQueue(queue.queue, params.key, '');
          channel.consume(queue.queue, function(msg) {
            const json = self._bufferToJSON(msg.content);
            console.log('cta-io -> Consuming new message: ', json);
            const res = params.cb(json);
            if (res instanceof Promise) {
              res.then(function() {
                self.channel.ack(msg);
                console.log('cta-io -> acknowledged message (promise): ', json);
              }, function(err) {
                self.channel.nack(msg);
                console.error('cta-io -> ', err);
              });
            } else {
              channel.ack(msg);
              console.log('cta-io -> acknowledged message (non-promise): ', json);
            }
          }, {noAck: false});
          resolve('ok');
        });
      } catch (e) {
        reject(e);
      }
    });
  }

  /**
   * Get info about a queue
   * @param {object} channel - rabbitMQ channel
   * @param {object} params - object parameters
   * @param {string} params.queue - the chanel queue name
   * @return {object} - promise
   */
  info(channel, params) {
    return new Promise((resolve, reject) => {
      try {
        channel.assertQueue(params.queue, null, function(err, data) {
          if (err) {
            return reject(err);
          }
          resolve(data);
        });
      } catch (e) {
        reject(e);
      }
    });
  }

  /**
   * Cancel a consumer
   * @param {object} channel - rabbitMQ channel
   * @param {string} consumerTag - tconsumerTag
   * @return {object} - promise
   */
  cancel(channel, consumerTag) {
    return new Promise((resolve, reject) => {
      try {
        channel.cancel(consumerTag, function(err, data) {
          if (err) {
            return reject(err);
          }
          resolve(data);
        });
      } catch (e) {
        reject(e);
      }
    });
  }

}

exports = module.exports = RQProvider;
