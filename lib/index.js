'use strict';

const shortid = require('shortid');
const validate = require('./validate');
const Silo = require('../../cta-silo/lib');
const os = require('os');
const path = require('path');
const co = require('co');

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
    const self = this;
    if (typeof providerName !== 'string') {
      throw new Error('Missing provider name');
    }
    if ( !(providerName in providers) ) {
      throw new Error('Unknown provider "' + providerName + '"');
    }
    const silopath = path.join(os.tmpDir(), 'silo');
    console.log('Creating persistent silo on file ' + silopath);
/*
    silo: {
      optional: true,
        type: 'object',
        defaultTo: {
        provider: 'nedb',
          path: path.join(os.tmpDir(), 'silo'),
      },
*/
    self.silo = new Silo('nedb', silopath);
    self.clients = {};
    self.provider = new providers[providerName](providerConfig);
    self.provider.on('reconnected', self._onReconnect.bind(self));
  }

  _onReconnect() {
    console.log('SQR => Provider has been reconnected');
    this._reconnectClients();
    this._consumeSiloMessages();
  }

  /**
   * Private: Execute an SQR method after parameters validation, ensures a common response pattern
   * @param {object} o - object of parameters
   * @param {string} o.method - SQR method name
   * @param {object} o.params - SQR method parameters
   * @param {object} o.pattern - SQR method parameters validation pattern
   * @return {object} - promise
   */
  _exec(o) {
    const self = this;
    return new Promise((resolve, reject) => {
      co(function* () {
        o.params = validate(o.params, o.pattern);
        o.params.extra = validate(o.params.extra, self.provider.extra[o.method]);
        const connection = yield self.provider._connect();
        const result = yield self.provider[o.method](connection, o.params);
        if (o.method === 'consume' || o.method === 'subscribe') {
          o.params._uid = shortid.generate();
          self.clients[o.params._uid] = {
            method: o.method,
            params: o.params,
          };
          console.log('SQR => Registered new consumer with uid ' + o.params._uid);
        }
        resolve(result);
      }).catch(function (err) {
        const errors = [];
        errors.push(err);
        if (o.method === 'produce' || o.method === 'publish') {
          self.silo.save({
            method: o.method,
            params: o.params,
          })
          .then(function (data) {
            errors.push({err: 'Can\'t produce message right now, scheduled...', msg: data});
            reject(errors);
          }, function (err2) {
            errors.push(err2);
            reject(errors);
          });
        }
      });
    });
  }

  _consumeSiloMessages() {
    const self = this;
    co(function* batch() {
      const messages = yield self.silo.find();
      const L = messages.length;
      console.log(L + ' message(s) in silo');
      // console.log(messages);
      if (L > 0) {
        console.log('consuming...');
        for (let i = 0; i < L; i++) {
          const e = messages[i];
          console.log('treating message', e);
          yield self[e.method](e.params);
          console.log('*** Removing element %s from silo', e._id);
          yield self.silo.remove(e._id);
        }
      }
    })
    .then(function() {
      console.log('*** all done');
    })
    .catch(function(err) {
      console.error(err);
    });
  }

  _reconnectClients() {
    const self = this;
    const keys = Object.keys(self.clients);
    const L = keys.length;
    if (L === 0) {
      console.log('No clients detected in silo');
    } else {
      console.log(L + ' client(s) detected in silo, reconnecting them...');
      for (let i = 0; i < L; i++) {
        const e = self.clients[keys[i]];
        self[e.method](e.params)
          .then((data) => {
            console.log('Reconnected Client with uid ', data.params._uid);
            delete self.clients[data.params._uid];
          })
          .catch((err) => {
            console.log('Can\'t reconnect Client with uid ', data.params._uid);
            console.error(err);
          });
      }
    }
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
    return this._exec({
      method: 'produce',
      params: params,
      pattern: {
        queue: 'string',
        json: 'object',
        extra: {
          optional: true,
          type: 'object',
          defaultTo: {},
        },
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
    return this._exec({
      method: 'consume',
      params: params,
      pattern: {
        queue: 'string',
        cb: 'function',
        extra: {
          optional: true,
          type: 'object',
          defaultTo: {},
        },
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
    return this._exec({
      method: 'publish',
      params: params,
      pattern: {
        key: 'string',
        json: 'object',
        extra: {
          optional: true,
          type: 'object',
          defaultTo: {},
        },
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
    return this._exec({
      method: 'subscribe',
      params: params,
      pattern: {
        key: 'string',
        cb: 'function',
        extra: {
          optional: true,
          type: 'object',
          defaultTo: {},
        },
      },
    });
  }

}

exports = module.exports = Sqr;
