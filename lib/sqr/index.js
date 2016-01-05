'use strict';

const validate = require('../validate/');
const q = require('q');

class Sqr {

  /**
   * Create a new Sqr instance
   * @param {object} provider - a provider instance (refer to providers)
   */
  constructor(provider) {
    if (typeof provider !== 'object') {
      throw new Error('Missing provider');
    }
    this.provider = provider;
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
    const res = validate(params, pattern);
    if (res !== true) {
      return q.reject(res);
    }
    return this.provider.produce(params);
  }

  /**
   * Consume a message from a queue
   * @param {object} params - object parameters
   * @param {string} params.queue - the queue name where to produce the message
   * @param {function} params.cb - callback function to run after consuming a message
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
    const res = validate(params, pattern);
    if (res !== true) {
      return q.reject(res);
    }
    return this.provider.consume(params);
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
    const res = validate(params, pattern);
    if (res !== true) {
      return q.reject(res);
    }
    return this.provider.publish(params);
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
    const res = validate(params, pattern);
    if (res !== true) {
      return q.reject(res);
    }
    return this.provider.subscribe(params);
  }

}

exports = module.exports = Sqr;
