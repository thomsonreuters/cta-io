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
   * @return {object} - promise
   */
  produce(channel, params) {
    const self = this;
    return new Promise((resolve, reject) => {
      try {
        channel.assertQueue(params.queue, {durable: true, autoDelete: false}, function(qErr, qData) {
          if (qErr) {
            return reject(qErr);
          }
          channel.sendToQueue(params.queue, self._jsonToBuffer(params.json), {persistent: true}, function(sErr) {
            if (sErr) {
              return reject(sErr);
            }
            console.log('cta-io -> Produced new message: ', params.json);
            resolve(qData);
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
    const self = this;
    return new Promise((resolve, reject) => {
      try {
        channel.assertQueue(params.queue, {durable: true, autoDelete: false}, function(qErr, qData) {
          if (qErr) {
            return reject(qErr);
          }
          channel.prefetch(1);
          channel.consume(params.queue, function(msg) {
            const json = self._bufferToJSON(msg.content);
            const res = params.cb(json);
            if (res instanceof Promise) {
              res.then(function() {
                self.channel.ack(msg);
                console.log('cta-io -> acknowledged message: ', json);
              }, function(cbErr) {
                console.error('cta-io -> ', cbErr);
              });
            } else {
              self.channel.ack(msg);
              console.log('cta-io -> acknowledged message: ', json);
            }
          }, {noAck: false}, function(cErr, cData) {
            if (cErr) {
              return reject(cErr);
            }
            console.log(`cta-io -> consume: starting new consumer with id ${cData.consumerTag}, waiting for messages in queue ${params.queue}`);
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
    const self = this;
    return new Promise((resolve, reject) => {
      try {
        channel.assertExchange(params.key, 'fanout', {durable: true, autoDelete: false}, function(aErr, aData) {
          if (aErr) {
            return reject(aErr);
          }
          channel.publish(params.key, '', self._jsonToBuffer(params.json), {persistent: true}, function(pErr) {
            if (pErr) {
              return reject(pErr);
            }
            console.log('cta-io -> Published new message: ', params.json);
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
    const self = this;
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
                const json = self._bufferToJSON(msg.content);
                console.log('cta-io -> Consuming new message: ', json);
                const res = params.cb(json);
                if (res instanceof Promise) {
                  res.then(function() {
                    self.channel.ack(msg);
                    console.log('cta-io -> acknowledged message (promise): ', json);
                  }, function(cbErr) {
                    self.channel.nack(msg);
                    console.error('cta-io -> ', cbErr);
                  });
                } else {
                  channel.ack(msg);
                  console.log('cta-io -> acknowledged message (non-promise): ', json);
                }
              }, {noAck: false}, function(cErr, cData) {
                if (cErr) {
                  return reject(cErr);
                }
                console.log(`cta-io -> subscribe: starting new consumer with id ${cData.consumerTag}, waiting for messages in queue ${params.key}`);
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
