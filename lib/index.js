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
      throw new Error('Missing provider');
    }
    if ( !(providerName in providers) ) {
      throw new Error('Unknown provider "' + providerName + '"');
    }
    this.provider = new providers[providerName](providerConfig);
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
    const pattern = {
      queue: 'string',
      json: 'object',
      extra: {
        optional: true,
        type: 'object',
        defaultTo: {},
      },
    };
    const p = validate(params, pattern);
    return this.provider.produce(p);
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
    const pattern = {
      queue: 'string',
      cb: 'function',
      extra: {
        optional: true,
        type: 'object',
        defaultTo: {},
      },
    };
    const p = validate(params, pattern);
    return this.provider.consume(p);
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
    const pattern = {
      key: 'string',
      json: 'object',
      extra: {
        optional: true,
        type: 'object',
        defaultTo: {},
      },
    };
    const p = validate(params, pattern);
    return this.provider.publish(p);
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
    const pattern = {
      key: 'string',
      cb: 'function',
      extra: {
        optional: true,
        type: 'object',
        defaultTo: {},
      },
    };
    const p = validate(params, pattern);
    return this.provider.subscribe(p);
  }

}

exports = module.exports = Sqr;
