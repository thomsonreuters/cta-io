'use strict';

const validate = require('../validate/');
const q = require('q');

class Sqr {

  constructor(provider, options) {
    this.provider = provider;
    this.options = options;
  }

  produce(obj) {
    const pattern = {
      queue: 'string',
      json: 'object',
    };
    const res = validate(obj, pattern);
    if (res !== true) {
      return q.reject(res);
    }
    return this.provider.produce(obj);
  }

  consume(obj) {
    const pattern = {
      queue: 'string',
      cb: 'function',
    };
    const res = validate(obj, pattern);
    if (res !== true) {
      return q.reject(res);
    }
    return this.provider.consume(obj);
  }

  publish(obj) {
    const pattern = {
      key: 'string',
      json: 'object',
    };
    const res = validate(obj, pattern);
    if (res !== true) {
      return q.reject(res);
    }
    return this.provider.publish(obj);
  }

  subscribe(obj) {
    const pattern = {
      key: 'string',
      cb: 'function',
    };
    const res = validate(obj, pattern);
    if (res !== true) {
      return q.reject(res);
    }
    return this.provider.subscribe(obj);
  }

}

exports = module.exports = Sqr;
