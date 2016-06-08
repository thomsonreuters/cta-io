'use strict';

const amqp = require('amqplib/callback_api');
const shortid = require('shortid');
const _ = require('lodash');
const defaultLogger = require('cta-logger');
const tools = require('cta-tools');

/**
 * RabbitMQProvider class
 * @class
 */
class RabbitMQProvider {
  /**
   * Create a new RabbitMQProvider instance
   * @param {object} params - RabbitMQ configuration
   * @param {string} params.url - RabbitMQ host
   * @param {object} logger - logger instance
   */
  constructor(params, logger) {
    const that = this;
    that.logger = logger || defaultLogger();
    that.options = tools.validate(params, {
      url: {
        optional: true,
        type: 'string',
        defaultTo: 'amqp://localhost?heartbeat=60',
      },
    }).output;

    that.reconnecting = false;
    that.interval = null;
    that.reconnectAfter = 10000;
    that.connection = null;
    that.connected = false;
    that.channel = null;
    that.consumers = {};
    that.messages = {};
  }

  /**
   * Convert a buffer to a json
   * @param {buffer} buffer - the buffer to convert
   * @private
   */
  _bufferToJSON(buffer) {
    return JSON.parse(buffer.toString());
  }

  /**
   * @param {object} json - the json to convert
   * @returns {Buffer} - the converted json as buffer
   * @private
   */
  _jsonToBuffer(json) {
    return new Buffer(JSON.stringify(json));
  }

  /**
   * Manage a consumed message, transform it to json, generate an id if necessary, save the message for acknowledgement
   * @param {object} msg - consumed message
   * @param {string} ackMode - ack mode
   * @returns {object}
   * @private
   */
  _processMsg(msg, ackMode) {
    const that = this;
    const json = that._bufferToJSON(msg.content);
    if (!json.id) {
      json.id = shortid.generate();
    }
    if (ackMode !== 'auto' && ackMode !== 'resolve') {
      that.messages[json.id] = {
        msg: msg,
        timestamp: Date.now(),
      };
    }
    return json;
  }

  /**
   * Execute a main method, first validate main method params, then check RabbitMQ connection, finally execute the method
   * @param params - main method parameters
   * @param pattern - main method parameters pattern for validation
   * @param cb - main method to execute
   * @returns {Promise}
   * @private
   */
  _exec(params, pattern, cb) {
    const that = this;
    return new Promise((resolve, reject) => {
      try {
        const vp = tools.validate(params, pattern).output;
        that.connect()
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
   * Reconnect RabbitMQ when connection is lost
   * @private
   */
  _reconnect() {
    const that = this;
    if (that.reconnecting === true) {
      that.logger.debug('RabbitMQ is already reconnecting.');
      return;
    }
    that.logger.debug('Reconnecting RabbitMQ...');
    that.reconnecting = true;
    that.interval = setInterval(function() {
      that.connect(true)
        .then(function() {
          clearInterval(that.interval);
          that.reconnecting = false;
          that.logger.info('RabbitMQ provider has been reconnected.');
          that._reconnectConsumers();
        });
    }, that.reconnectAfter);
  }

  /**
   * Reconnect consumers after RabbitMQ is reconnected
   * @private
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

  /**
   * RabbitMQ health check
   * @returns {boolean} - true if connected, false if not
   */
  healthCheck() {
    return this.connected;
  }

  /**
   * Connect RabbitMQ & set connection & channel properties
   * @param {Boolean} force - weather to force connection or return existing connection
   * @returns {Promise}
   */
  connect(force) {
    const that = this;
    return new Promise((resolve, reject) => {
      if (force !== true && that.connection && that.channel) {
        return resolve(that.channel);
      }
      that.logger.debug('Connecting to rabbitMQ...');
      amqp.connect(that.options.url, function(connErr, connection) {
        if (connErr) {
          that.logger.debug('RabbitMQ connection error');
          that._reconnect();
          return reject(connErr);
        }
        that.logger.debug('Connected to rabbitMQ');
        connection.on('close', function() {
          that.logger.debug('RabbitMQ connection close event');
          that.connected = false;
          that._reconnect();
        });
        connection.on('error', function(err) {
          that.logger.debug('RabbitMQ connection error event: ', err);
        });
        that.connection = connection;
        that.connected = true;
        connection.createConfirmChannel(function(chErr, channel) {
          if (chErr) {
            return reject(chErr);
          }
          that.logger.debug('Created new RabbitMQ channel');
          channel.on('close', function() {
            that.logger.debug('RabbitMQ channel close event');
            that._reconnect();
          });
          channel.on('error', function(err) {
            that.logger.debug('RabbitMQ channel error event: ', err);
          });
          that.channel = channel;
          resolve(that.channel);
        });
      });
    });
  }

  /**
   * Produce a message in a queue
   * @param {object} params - object of parameters
   * @param {string} params.queue - the queue name where to produce the message
   * @param {object} params.json - the message to produce as json
   * @return {object} - promise
   */
  produce(params) {
    const that = this;
    const pattern = {
      queue: 'string',
      json: 'object',
    };
    return that._exec(params, pattern, (vp) => {
      return new Promise((resolve, reject) =>{
        that.channel.assertQueue(vp.queue, {durable: true, autoDelete: false}, function(qErr, qData) {
          if (qErr) {
            return reject(qErr);
          }
          that.channel.sendToQueue(vp.queue, that._jsonToBuffer(vp.json), {persistent: true}, function(sErr) {
            if (sErr) {
              return reject(sErr);
            }
            that.logger.debug('Produced new message: ', vp.json);
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
   * @param {string} params.ack - ack mode
   * if 'auto': ack as soon as the message is consumed
   * else you should ack manually by calling provider's ack method
   * @return {object} - promise
   */
  get(params) {
    const that = this;
    const pattern = {
      queue: 'string',
      ack: {
        optional: true,
        type: 'string',
        defaultTo: '',
      },
    };
    return that._exec(params, pattern, (vp) => {
      return new Promise((resolve, reject) => {
        that.channel.prefetch(1);
        that.logger.debug('Getting a message in queue "%s"', vp.queue);
        that.channel.get(vp.queue, {noAck: (vp.ack === 'auto')}, function(getErr, msg) {
          if (getErr) {
            return reject(getErr);
          }
          let json = {};
          if (!msg) {
            json = null;
          } else {
            json = that._processMsg(msg, (vp.ack !== 'auto'));
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
   * @param {string} params.ack - ack mode
   * if 'auto': ack as soon as the message is consumed
   * if 'resolve': ack as soon as the callback is resolved
   * else you should ack manually by calling provider's ack method
   * @return {object} - promise
   */
  consume(params) {
    const that = this;
    const pattern = {
      queue: 'string',
      cb: 'function',
      ack: {
        optional: true,
        type: 'string',
        defaultTo: '',
      },
    };
    return that._exec(params, pattern, (vp) => {
      return new Promise((resolve, reject) => {
        that.channel.assertQueue(vp.queue, {durable: true, autoDelete: false}, function(qErr, qData) {
          if (qErr) {
            return reject(qErr);
          }
          that.channel.prefetch(1);
          that.channel.consume(vp.queue, function(msg) {
            const json = that._processMsg(msg, !/^auto$|^resolve$/.test(vp.ack));
            that.logger.debug('consume: received new message, ', json);
            const res = vp.cb(json);
            if (res instanceof Promise) {
              res.then(function() {
                that.logger.debug('resolved consume callback');
                if (vp.ack === 'resolve') {
                  that.channel.ack(msg);
                  that.logger.debug('acknowledged message: ', json);
                }
              }, function(cbErr) {
                that.logger.debug('cb error: ', cbErr);
              });
            } else {
              that.logger.debug('resolved consume callback');
              if (vp.ack === 'resolve') {
                that.channel.ack(msg);
                that.logger.debug('acknowledged message: ', json);
              }
            }
          }, {noAck: (vp.ack === 'auto')}, function(cErr, cData) {
            if (cErr) {
              return reject(cErr);
            }
            that.logger.debug(`consume: starting new consumer with id ${cData.consumerTag}, waiting for messages in queue ${vp.queue}`);
            that.consumers[cData.consumerTag] = {
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
    const that = this;
    const pattern = {
      key: 'string',
      json: 'object',
    };
    return that._exec(params, pattern, (vp) => {
      return new Promise((resolve, reject) => {
        try {
          that.channel.assertExchange(vp.key, 'fanout', {durable: true, autoDelete: false}, function(aErr, aData) {
            if (aErr) {
              return reject(aErr);
            }
            that.channel.publish(vp.key, '', that._jsonToBuffer(vp.json), {persistent: true}, function(pErr) {
              if (pErr) {
                return reject(pErr);
              }
              that.logger.debug('Published new message: ', vp.json);
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
   * @param {string} params.ack - ack mode:
   * - if 'auto': ack as soon as the message is consumed
   * - if 'resolve': ack as soon as the callback is resolved
   * - else you should ack manually by calling provider's ack method
   * @return {object} - promise
   */
  subscribe(params) {
    const that = this;
    const pattern = {
      key: 'string',
      cb: 'function',
      ack: {
        optional: true,
        type: 'string',
        defaultTo: '',
      },
    };
    return that._exec(params, pattern, (vp) => {
      return new Promise((resolve, reject) => {
        that.channel.assertExchange(vp.key, 'fanout', {durable: true, autoDelete: false}, function(xErr, xData) {
          if (xErr) {
            return reject(xErr);
          }
          that.channel.assertQueue(vp.key, {durable: true, autoDelete: false}, function(qErr, qData) {
            if (qErr) {
              return reject(qErr);
            }
            that.channel.bindQueue(qData.queue, vp.key, '', {}, function(bErr) {
              if (bErr) {
                return reject(bErr);
              }
              that.channel.consume(qData.queue, function(msg) {
                const json = that._processMsg(msg, !/^auto$|^resolve$/.test(vp.ack));
                that.logger.debug('subscribe: received new message, ', json);
                const res = vp.cb(json);
                if (res instanceof Promise) {
                  res.then(function() {
                    that.logger.debug('resolved subscribe callback');
                    if (vp.ack === 'resolve') {
                      that.channel.ack(msg);
                      that.logger.debug('acknowledged message: ', json);
                    }
                  }, function(cbErr) {
                    that.logger.debug('cb error: ', cbErr);
                  });
                } else {
                  that.logger.debug('resolved subscribe callback');
                  if (vp.ack === 'resolve') {
                    that.channel.ack(msg);
                    that.logger.debug('acknowledged message: ', json);
                  }
                }
              }, {noAck: (vp.ack === 'auto')}, function(cErr, cData) {
                if (cErr) {
                  return reject(cErr);
                }
                that.logger.debug(`subscribe: starting new consumer with id ${cData.consumerTag}, waiting for messages in queue ${vp.key}`);
                that.consumers[cData.consumerTag] = {
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
   * Acknowledge a message in a queue, remove it from the queue
   * @param {string} ackid - id of the message to acknowledge
   * @returns {Promise}
   */
  ack(ackid) {
    const that = this;
    return that._exec({ackid: ackid}, {ackid: 'string'}, (vp) => {
      that.channel.ack(that.messages[vp.ackid].msg);
    });
  }

  /**
   * Not acknowledge a message in a queue, put it back to the queue
   * @param {string} ackid - id of the message to acknowledge
   * @returns {Promise}
   */
  nack(ackid) {
    const that = this;
    return that._exec({ackid: ackid}, {ackid: 'string'}, (vp) => {
      that.channel.nack(that.messages[vp.ackid].msg);
    });
  }

  /**
   * Get information about a queue
   * @param {object} params - object of parameters
   * @param {string} params.queue - queue name
   * @return {object} - promise
   */
  info(params) {
    const that = this;
    if (typeof params === 'string') {
      params = {
        queue: params,
      };
    }
    const pattern = {
      queue: 'string',
    };
    return that._exec(params, pattern, (vp) => {
      return new Promise((resolve, reject) => {
        that.channel.assertQueue(vp.queue, null, function(err, data) {
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
    const that = this;
    const pattern = {
      consumerTag: 'string',
    };
    return that._exec({consumerTag: consumerTag}, pattern, (vp) => {
      return new Promise((resolve, reject) => {
        that.channel.cancel(vp.consumerTag, function(err, data) {
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
