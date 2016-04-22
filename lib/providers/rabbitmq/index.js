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
  constructor(params, logger) {
    super();
    const that = this;
    that.logger = logger;
    that.options = validate(params, {
      url: {
        optional: true,
        type: 'string',
        defaultTo: 'amqp://localhost?heartbeat=60',
      },
    });

    that.reconnecting = false;
    that.interval = null;
    that.reconnectAfter = 10000;
    that.connection = null;
    that.connected = false;
    that.channel = null;
  }

  _reconnect() {
    const that = this;
    if (that.reconnecting === true) {
      that.logger.info('*** already reconnecting...');
      return;
    }
    that.reconnecting = true;
    that.interval = setInterval(function() {
      that.connect(true)
        .then(function() {
          clearInterval(that.interval);
          that.emit('reconnected');
          that.reconnecting = false;
        });
    }, that.reconnectAfter);
  }

  connect(force) {
    const that = this;
    return new Promise((resolve, reject) => {
      if (force !== true && that.connection && that.channel) {
        return resolve(that.channel);
      }
      that.logger.info('*** Connecting to rabbitMQ...');
      amqp.connect(that.options.url, function(connErr, connection) {
        if (connErr) {
          that.logger.info('*** rabbitMQ connection error');
          that._reconnect();
          reject(connErr);
        } else {
          connection.on('close', function() {
            that.logger.info('*** connection close event');
            that.connected = false;
            that._reconnect();
          });
          connection.on('error', function(err) {
            that.logger.info('*** connection error event: ', err);
          });
          that.connection = connection;
          that.connected = true;
          connection.createConfirmChannel(function(chErr, channel) {
            if (chErr) {
              reject(chErr);
            } else {
              channel.on('close', function() {
                that.logger.info('*** channel close event');
              });
              channel.on('error', function(err) {
                that.logger.info('*** channel error event: ', err);
              });
              that.channel = channel;
              resolve(that.channel);
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
   * @return {object} - promise
   */
  produce(channel, params) {
    const that = this;
    return new Promise((resolve, reject) => {
      try {
        channel.assertQueue(params.queue, {durable: true, autoDelete: false}, function(qErr, qData) {
          if (qErr) {
            return reject(qErr);
          }
          channel.sendToQueue(params.queue, that._jsonToBuffer(params.json), {persistent: true}, function(sErr) {
            if (sErr) {
              return reject(sErr);
            }
            that.logger.info('Produced new message: ', params.json);
            resolve(qData);
          });
        });
      } catch (e) {
        reject(e);
      }
    });
  }

  /**
   * Get a message from a queue
   * @param {object} channel - rabbitMQ channel
   * @param {object} params - object parameters
   * @param {string} params.queue - the queue name where to get the message
   * @param {function} params.cb - callback function to run after getting a message
   * @return {object} - promise
   */
  get(channel, params) {
    const that = this;
    return new Promise((resolve, reject) => {
      try {
        channel.assertQueue(params.queue, {durable: true, autoDelete: false}, function(qErr, qData) {
          if (qErr) {
            return reject(qErr);
          }
          channel.prefetch(1);
          that.logger.info('Getting a message in queue "%s"', params.queue);
          channel.get(params.queue, {noAck: false}, function(getErr, msg) {
            if (getErr) {
              return reject(getErr);
            }
            let json = {};
            if (!msg) {
              json = null;
            } else {
              json = that._bufferToJSON(msg.content);
            }
            const res = params.cb(json);
            if (res instanceof Promise) {
              res.then(function() {
                if (msg) {
                  that.channel.ack(msg);
                  that.logger.info('acknowledged message: ', json);
                }
              }, function(cbErr) {
                that.logger.error('', cbErr);
              });
            } else {
              if (msg) {
                that.channel.ack(msg);
                that.logger.info('acknowledged message: ', json);
              }
            }
            resolve(_.assign(qData, {
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
   * @return {object} - promise
   */
  consume(channel, params) {
    const that = this;
    return new Promise((resolve, reject) => {
      try {
        channel.assertQueue(params.queue, {durable: true, autoDelete: false}, function(qErr, qData) {
          if (qErr) {
            return reject(qErr);
          }
          channel.prefetch(1);
          channel.consume(params.queue, function(msg) {
            const json = that._bufferToJSON(msg.content);
            const res = params.cb(json);
            if (res instanceof Promise) {
              res.then(function() {
                that.channel.ack(msg);
                that.logger.info('acknowledged message: ', json);
              }, function(cbErr) {
                that.logger.error('', cbErr);
              });
            } else {
              that.channel.ack(msg);
              that.logger.info('acknowledged message: ', json);
            }
          }, {noAck: false}, function(cErr, cData) {
            if (cErr) {
              return reject(cErr);
            }
            that.logger.info(`consume: starting new consumer with id ${cData.consumerTag}, waiting for messages in queue ${params.queue}`);
            resolve(_.assign(qData, cData));
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
   * @return {object} - promise
   */
  publish(channel, params) {
    const that = this;
    return new Promise((resolve, reject) => {
      try {
        channel.assertExchange(params.key, 'fanout', {durable: true, autoDelete: false}, function(aErr, aData) {
          if (aErr) {
            return reject(aErr);
          }
          channel.publish(params.key, '', that._jsonToBuffer(params.json), {persistent: true}, function(pErr) {
            if (pErr) {
              return reject(pErr);
            }
            that.logger.info('Published new message: ', params.json);
            resolve(aData);
          });
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
   * @return {object} - promise
   */
  subscribe(channel, params) {
    const that = this;
    return new Promise((resolve, reject) => {
      try {
        channel.assertExchange(params.key, 'fanout', {durable: true, autoDelete: false}, function(xErr, xData) {
          if (xErr) {
            return reject(xErr);
          }
          channel.assertQueue(params.key, {durable: true, autoDelete: false}, function(qErr, qData) {
            if (qErr) {
              return reject(qErr);
            }
            channel.bindQueue(qData.queue, params.key, '', {}, function(bErr) {
              if (bErr) {
                return reject(bErr);
              }
              channel.consume(qData.queue, function(msg) {
                const json = that._bufferToJSON(msg.content);
                that.logger.info('Consuming new message: ', json);
                const res = params.cb(json);
                if (res instanceof Promise) {
                  res.then(function() {
                    that.channel.ack(msg);
                    that.logger.info('acknowledged message (promise): ', json);
                  }, function(cbErr) {
                    that.channel.nack(msg);
                    that.logger.error('', cbErr);
                  });
                } else {
                  channel.ack(msg);
                  that.logger.info('acknowledged message (non-promise): ', json);
                }
              }, {noAck: false}, function(cErr, cData) {
                if (cErr) {
                  return reject(cErr);
                }
                that.logger.info(`subscribe: starting new consumer with id ${cData.consumerTag}, waiting for messages in queue ${params.key}`);
                resolve(_.assign(xData, qData, cData));
              });
            });
          });
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
