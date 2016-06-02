'use strict';

const amqp = require('amqplib/callback_api');
const _ = require('lodash');
const defaultLogger = require('cta-logger');
const validate = require('../../validate/');

class RabbitMQProvider {
  /**
   * Create a new RQProvider instance
   * @param {object} params - object parameters
   * @param {object} logger - logger instance
   * @param {string} params.url - rabbitMQ host
   */
  constructor(params, logger) {
    const self = this;
    self.logger = logger || defaultLogger();
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
    self.consumers = {};
  }

  _reconnect() {
    const self = this;
    if (self.reconnecting === true) {
      self.logger.debug('RabbitMQ is already reconnecting.');
      return;
    }
    self.logger.debug('Reconnecting RabbitMQ...');
    self.reconnecting = true;
    self.interval = setInterval(function() {
      self.connect(true)
        .then(function() {
          clearInterval(self.interval);
          self.reconnecting = false;
          self.logger.info('RabbitMQ provider has been reconnected.');
          self._reconnectConsumers();
        });
    }, self.reconnectAfter);
  }

  /**
   * Private: reconnect consumers/subscribers after provider's reconnection
   */
  _reconnectConsumers() {
    const that = this;
    const keys = Object.keys(that.consumers);
    const L = keys.length;
    if (L === 0) {
      that.logger.info('No consumers detected');
    } else {
      that.logger.info(`${L} consumer(s) detected, reconnecting them...`);
      for (let i = 0; i < L; i++) {
        const e = that.consumers[keys[i]];
        that[e.method](e.params)
          .then((data) => {
            that.logger.info('Reconnected consumer with consumerTag ', keys[i]);
            delete that.consumers[keys[i]];
          })
          .catch((err) => {
            that.logger.error('Can\'t reconnect consumer with consumerTag ' + keys[i], err);
          });
      }
    }
  }

  connect(force) {
    const self = this;
    return new Promise((resolve, reject) => {
      if (force !== true && self.connection && self.channel) {
        return resolve(self.channel);
      }
      self.logger.debug('Connecting to rabbitMQ...');
      amqp.connect(self.options.url, function(connErr, connection) {
        if (connErr) {
          self.logger.debug('RabbitMQ connection error');
          self._reconnect();
          return reject(connErr);
        }
        self.logger.debug('Connected to rabbitMQ');
        connection.on('close', function() {
          self.logger.debug('RabbitMQ connection close event');
          self.connected = false;
          self._reconnect();
        });
        connection.on('error', function(err) {
          self.logger.debug('RabbitMQ connection error event: ', err);
        });
        self.connection = connection;
        self.connected = true;
        connection.createConfirmChannel(function(chErr, channel) {
          if (chErr) {
            return reject(chErr);
          }
          self.logger.debug('Created new RabbitMQ channel');
          channel.on('close', function() {
            self.logger.debug('RabbitMQ channel close event');
            self._reconnect();
          });
          channel.on('error', function(err) {
            self.logger.debug('RabbitMQ channel error event: ', err);
          });
          self.channel = channel;
          resolve(self.channel);
        });
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

  _exec(params, pattern, cb) {
    const self = this;
    return new Promise((resolve, reject) => {
      try {
        const vp = validate(params, pattern);
        self.connect()
          .then(() => {
            return cb(vp);
          })
          .then((result) => {
            resolve({result: result, params: vp});
          })
          .catch((err) => {
            reject(err);
          });
      } catch (e) {
        reject(e);
      }
    });
  }

  /**
   * Produce a message in a queue
   * @param {object} params - object parameters
   * @param {string} params.queue - the queue name where to produce the message
   * @param {object} params.json - the message to produce as json
   * @return {object} - promise
   */
  produce(params) {
    const self = this;
    const pattern = {
      queue: 'string',
      json: 'object',
    };
    return self._exec(params, pattern, (vp) => {
      return new Promise((resolve, reject) =>{
        self.channel.assertQueue(vp.queue, {durable: true, autoDelete: false}, function(qErr, qData) {
          if (qErr) {
            return reject(qErr);
          }
          self.channel.sendToQueue(vp.queue, self._jsonToBuffer(vp.json), {persistent: true}, function(sErr) {
            if (sErr) {
              return reject(sErr);
            }
            self.logger.debug('Produced new message: ', vp.json);
            resolve(qData);
          });
        });
      });
    });
  }

  /**
   * Get a message from a queue
   * @param {object} params - object parameters
   * @param {string} params.queue - the queue name where to get the message
   * @param {function} params.cb - callback function to run after getting a message
   * @return {object} - promise
   */
  get(params) {
    const self = this;
    const pattern = {
      queue: 'string',
      cb: 'function',
    };
    return self._exec(params, pattern, (vp) => {
      return new Promise((resolve, reject) => {
        self.channel.prefetch(1);
        self.logger.debug('Getting a message in queue "%s"', vp.queue);
        self.channel.get(vp.queue, {noAck: false}, function (getErr, msg) {
          if (getErr) {
            return reject(getErr);
          }
          let json = {};
          if (!msg) {
            json = null;
          } else {
            json = self._bufferToJSON(msg.content);
          }
          const res = vp.cb(json);
          if (res instanceof Promise) {
            res.then(function () {
              if (msg) {
                self.channel.ack(msg);
                self.logger.debug('acknowledged message: ', json);
              }
            }, function (cbErr) {
              self.logger.debug('cb error: ', cbErr);
            });
          } else {
            if (msg) {
              self.channel.ack(msg);
              self.logger.debug('acknowledged message: ', json);
            }
          }
          resolve({
            json: json,
          });
        });
      });
    });
  }

  /**
   * Consume a message from a queue
   * @param {object} params - object parameters
   * @param {string} params.queue - the queue name where to produce the message
   * @param {function} params.cb - callback function to run after consuming a message
   * @return {object} - promise
   */
  consume(params) {
    const self = this;
    const pattern = {
      queue: 'string',
      cb: 'function',
    };
    return self._exec(params, pattern, (vp) => {
      return new Promise((resolve, reject) => {
        self.channel.assertQueue(vp.queue, {durable: true, autoDelete: false}, function (qErr, qData) {
          if (qErr) {
            return reject(qErr);
          }
          self.channel.prefetch(1);
          self.channel.consume(vp.queue, function (msg) {
            const json = self._bufferToJSON(msg.content);
            const res = vp.cb(json);
            if (res instanceof Promise) {
              res.then(function () {
                self.channel.ack(msg);
                self.logger.debug('acknowledged message: ', json);
              }, function (cbErr) {
                self.logger.debug('cb error: ', cbErr);
              });
            } else {
              self.channel.ack(msg);
              self.logger.debug('acknowledged message: ', json);
            }
          }, {noAck: false}, function (cErr, cData) {
            if (cErr) {
              return reject(cErr);
            }
            self.logger.debug(`consume: starting new consumer with id ${cData.consumerTag}, waiting for messages in queue ${vp.queue}`);
            self.consumers[cData.consumerTag] = {
              method: 'consume',
              params: params,
            };
            resolve(_.assign(qData, cData));
          });
        });
      });
    });
  }

  /**
   * Publish a message to a chanel
   * @param {object} params - object parameters
   * @param {string} params.key - the chanel key name where to publish the message
   * @param {object} params.json - the message to publish in json format
   * @return {object} - promise
   */
  publish(params) {
    const self = this;
    const pattern = {
      key: 'string',
      json: 'object',
    };
    return self._exec(params, pattern, (vp) => {
      return new Promise((resolve, reject) => {
        try {
          self.channel.assertExchange(vp.key, 'fanout', {durable: true, autoDelete: false}, function (aErr, aData) {
            if (aErr) {
              return reject(aErr);
            }
            self.channel.publish(vp.key, '', self._jsonToBuffer(vp.json), {persistent: true}, function (pErr) {
              if (pErr) {
                return reject(pErr);
              }
              self.logger.debug('Published new message: ', vp.json);
              resolve(aData);
            });
          });
        } catch (e) {
          reject(e);
        }
      });
    });
  }

  /**
   * Subscribe to messages from a chanel
   * @param {object} params - object parameters
   * @param {string} params.key - the chanel key name where to listen to messages
   * @param {function} params.cb - callback function to run after receiving a message, it takes the received json msg as a param
   * @return {object} - promise
   */
  subscribe(params) {
    const self = this;
    const pattern = {
      key: 'string',
      cb: 'function',
    };
    return self._exec(params, pattern, (vp) => {
      return new Promise((resolve, reject) => {
        self.channel.assertExchange(vp.key, 'fanout', {durable: true, autoDelete: false}, function (xErr, xData) {
          if (xErr) {
            return reject(xErr);
          }
          self.channel.assertQueue(vp.key, {durable: true, autoDelete: false}, function (qErr, qData) {
            if (qErr) {
              return reject(qErr);
            }
            self.channel.bindQueue(qData.queue, vp.key, '', {}, function (bErr) {
              if (bErr) {
                return reject(bErr);
              }
              self.channel.consume(qData.queue, function (msg) {
                const json = self._bufferToJSON(msg.content);
                self.logger.debug('Consuming new message: ', json);
                const res = vp.cb(json);
                if (res instanceof Promise) {
                  res.then(function () {
                    self.channel.ack(msg);
                    self.logger.debug('acknowledged message (promise): ', json);
                  }, function (cbErr) {
                    self.channel.nack(msg);
                    self.logger.debug('cb error: ', cbErr);
                  });
                } else {
                  self.channel.ack(msg);
                  self.logger.debug('acknowledged message (non-promise): ', json);
                }
              }, {noAck: false}, function (cErr, cData) {
                if (cErr) {
                  return reject(cErr);
                }
                self.logger.debug(`subscribe: starting new consumer with id ${cData.consumerTag}, waiting for messages in queue ${vp.key}`);
                self.consumers[cData.consumerTag] = {
                  method: 'subscribe',
                  params: params,
                };
                resolve(_.assign(xData, qData, cData));
              });
            });
          });
        });
      });
    });
  }

  /**
   * Get info about a queue
   * @param {object} params - object parameters
   * @param {string} params.queue - the chanel queue name
   * @return {object} - promise
   */
  info(params) {
    const self = this;
    const pattern = {
      queue: 'string',
    };
    return self._exec(params, pattern, (vp) => {
      return new Promise((resolve, reject) => {
        self.channel.assertQueue(vp.queue, null, function (err, data) {
          if (err) {
            return reject(err);
          }
          resolve(data);
        });
      });
    });
  }

  /**
   * Cancel a consumer
   * @param {string} consumerTag - consumerTag
   * @return {object} - promise
   */
  cancel(consumerTag) {
    const self = this;
    const pattern = {
      consumerTag: 'string',
    };
    return self._exec({consumerTag: consumerTag}, pattern, (vp) => {
      return new Promise((resolve, reject) => {
        self.channel.cancel(vp.consumerTag, function (err, data) {
          if (err) {
            return reject(err);
          }
          resolve(data);
        });
      });
    });
  }

}

exports = module.exports = RabbitMQProvider;
