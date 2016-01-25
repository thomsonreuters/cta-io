'use strict';

const validate = require('./validate');

const providers = {
  rabbitmq: require('./providers/rabbitmq'),
  wampkue: require('./providers/wampkue'),
};

class Sqr {

  /**
   * Create a new Sqr instance
   * @param {string} providerName - provider name, refer to list of available providers
   * @param {object} providerConfig - provider configuration, refer to provider's doc
   */
  constructor(providerName, providerConfig) {
    if (typeof providerName !== 'string') {
      throw new Error('Missing provider name');
    }
    if ( !(providerName in providers) ) {
      throw new Error('Unknown provider "' + providerName + '"');
    }
    this.provider = new providers[providerName](providerConfig);
  }

  /**
   * Private: Execute an SQR method after parameters validation, ensures a common response pattern
   * @param {string} method - SQR method name
   * @param {object} params - SQR method parameters
   * @param {object} pattern - SQR method parameters validation pattern
   * @return {object} - promise
   */
  _exec(method, params, pattern) {
    const self = this;
    return new Promise((resolve, reject) => {
      try {
        const p = validate(params, pattern);
        return self.provider[method](p)
          .then(function(result) {
            resolve({params: p, result: result});
          })
          .catch(function(err) {
            reject({params: p, result: err});
          });
      } catch (e) {
        reject({params: params, result: e});
      }
    });
  }

  /**
   * Produce a message in a queue
   * @param {object} params - object parameters
   * @param {string} params.queue - the queue name where to produce the message
   * @param {object} params.json - the message to produce as json
   * @param {object} params.extra - provider's extra parameters
   * @return {object} - promise
   */
  produce(params) {
    return this._exec('produce', params, {
      queue: 'string',
      json: 'object',
      extra: {
        optional: true,
        type: 'object',
        defaultTo: {},
      },
    });
  }

  /**
   * Consume a message from a queue
   * @param {object} params - object parameters
   * @param {string} params.queue - the queue name where to produce the message
   * @param {function} params.cb - callback function to run after consuming a message, should return a promise
   * @param {object} params.extra - provider's extra parameters
   * @return {object} - promise
   */
  consume(params) {
    return this._exec('consume', params, {
      queue: 'string',
      cb: 'function',
      extra: {
        optional: true,
        type: 'object',
        defaultTo: {},
      },
    });
  }

  /**
   * Publish a message to a chanel
   * @param {object} params - object parameters
   * @param {string} params.key - the chanel key name where to publish the message
   * @param {object} params.json - the message to publish in json format
   * @param {object} params.extra - provider's extra parameters
   * @return {object} - promise
   */
  publish(params) {
    return this._exec('publish', params, {
      key: 'string',
      json: 'object',
      extra: {
        optional: true,
        type: 'object',
        defaultTo: {},
      },
    });
  }

  /**
   * Subscribe to messages from a chanel
   * @param {object} params - object parameters
   * @param {string} params.key - the chanel key name where to listen to messages
   * @param {function} params.cb - callback function to run after receiving a message
   * @param {object} params.extra - provider's extra parameters
   * @return {object} - promise
   */
  subscribe(params) {
    return this._exec('subscribe', params, {
      key: 'string',
      cb: 'function',
      extra: {
        optional: true,
        type: 'object',
        defaultTo: {},
      },
    });
  }

}

exports = module.exports = Sqr;
