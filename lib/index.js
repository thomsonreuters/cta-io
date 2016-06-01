'use strict';

const shortid = require('shortid');
const co = require('co');
const defaultLogger = require('cta-logger');
const validate = require('./validate');
const providers = require('./providers');


class Io {

  /**
   * Create a new Io instance
   * @param {string} provider - provider name, refer to list of available providers
   * @param {object} options - provider options, refer to provider's doc
   * @param {object} logger - logger instance
   */
  constructor(provider, options, logger) {
    const that = this;
    if (typeof provider !== 'string') {
      throw new Error('Missing provider name');
    }
    if ( !(provider in providers) ) {
      throw new Error('Unknown provider "' + provider + '"');
    }

    this.logger = logger || defaultLogger();

    that.clients = {};
    that.provider = new providers[provider](options, this.logger);
    try {
      that.provider.on('reconnected', that._onReconnect.bind(that));
    } catch (e) {
      that.logger.info(`Warning: provider ${provider} doesn't provide on.reconnected event`);
    }
  }

  /**
   * Private: Execute an Io public method
   * Validate parameters & ensure a common response pattern
   * @param {object} o - object of parameters
   * @param {string} o.method - Io method name
   * @param {object} o.params - Io method parameters
   * @param {object} o.pattern - Io method parameters validation pattern
   * @return {object} - promise
   */
  _exec(o) {
    const that = this;
    return new Promise((resolve, reject) => {
      co(function* () {
        // validate common params for all providers
        if (o.pattern) {
          o.params = validate(o.params, o.pattern);
        }
        // get connection instance from provider
        const connection = yield that.provider.connect();
        // get method result from provider
        const result = yield that.provider[o.method](connection, o.params);
        // save consumer/subscriber for recovery
        if (o.method === 'consume' || o.method === 'subscribe') {
          o.params._uid = shortid.generate();
          that.clients[o.params._uid] = {
            method: o.method,
            params: o.params,
          };
          that.logger.info('Registered new consumer with uid ' + o.params._uid);
        }
        resolve({result: result, params: o.params});
      })
      .catch(function(err) {
        // reject if params validate error
        // TODO improve this test
        if (typeof err === 'object' && 'message' in err && err.message.indexOf('validate module => ') === 0) {
          return reject(err.message);
        }
        reject(err);
      });
    });
  }

  /**
   * Private: starts recovery after provider reconnection
   */
  _onReconnect() {
    this.logger.info('Provider has been reconnected');
    this._reconnectClients();
  }

  /**
   * Private: reconnect consumers/subscribers after provider's reconnection
   */
  _reconnectClients() {
    const that = this;
    const keys = Object.keys(that.clients);
    const L = keys.length;
    if (L === 0) {
      that.logger.info('No clients detected');
    } else {
      that.logger.info(`${L} client(s) detected, reconnecting them...`);
      for (let i = 0; i < L; i++) {
        const e = that.clients[keys[i]];
        that[e.method](e.params)
          .then((data) => {
            that.logger.info('Reconnected Client with uid ', data.params._uid);
            delete that.clients[data.params._uid];
          })
          .catch((err) => {
            that.logger.error('Can\'t reconnect Client with uid ' + data.params._uid, err);
          });
      }
    }
  }
  /**
   * Service health check
   * @return {boolean} - true if service is up, false if it's down
   */
  healthCheck() {
    return this.provider.healthCheck() === true;
  }

  /**
   * Produce a message in a queue
   * @param {object} params - object parameters
   * @param {string} params.queue - the queue name where to produce the message
   * @param {object} params.json - the message to produce as json
   * @return {object} - promise
   */
  produce(params) {
    return this._exec({
      method: 'produce',
      params: params,
      pattern: {
        queue: 'string',
        json: 'object',
      },
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
    return this._exec({
      method: 'get',
      params: params,
      pattern: {
        queue: 'string',
        cb: 'function',
      },
    });
  }

  /**
   * Register a consumer to consume messages from a queue as soon as they are produced
   * This method consumes one message from the queue, the next message will be consumed after acknowledge
   * @param {object} params - object parameters
   * @param {string} params.queue - the queue name where to produce the message
   * @param {function} params.cb - callback function to run after consuming a message
   * @return {object} - promise
   */
  consume(params) {
    return this._exec({
      method: 'consume',
      params: params,
      pattern: {
        queue: 'string',
        cb: 'function',
      },
    });
  }

  /**
   * Publish a message to a queue
   * @param {object} params - object parameters
   * @param {string} params.key - the queue name where to publish the message
   * @param {object} params.json - the message to publish in json format
   * @return {object} - promise
   */
  publish(params) {
    return this._exec({
      method: 'publish',
      params: params,
      pattern: {
        key: 'string',
        json: 'object',
      },
    });
  }

  /**
   * Register a subscriber to consume ALL messages as soon as they are produced
   * @param {object} params - object parameters
   * @param {string} params.key - the chanel key name where to listen to messages
   * @param {function} params.cb - callback function to run after receiving a message
   * @return {object} - promise
   */
  subscribe(params) {
    return this._exec({
      method: 'subscribe',
      params: params,
      pattern: {
        key: 'string',
        cb: 'function',
      },
    });
  }

  /**
   * Get information about a queue
   * @param {object} params - object parameters
   * @param {string} params.queue - the chanel queue name
   * @return {object} - promise
   */
  info(params) {
    return this._exec({
      method: 'info',
      params: params,
      pattern: {
        queue: 'string',
      },
    });
  }

  /**
   * Cancel a consumer
   * @param {string} id - consumer unique id
   * @return {object} - promise
   */
  cancel(id) {
    return this._exec({
      method: 'cancel',
      params: id,
    });
  }

}

exports = module.exports = Io;
