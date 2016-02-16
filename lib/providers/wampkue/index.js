'use strict';

const autobahn = require('autobahn');
const kue = require('kue');
const shortid = require('shortid');
const validate = require('../../validate/');


const config = {};

/**
 * Execute a wamp method after authentication
 * @param {function} cb - wamp method to run, takes wamp session as param
 * @return {object} - promise
 */
function exec(cb) {
  return new Promise((resolve, reject) => {
    const connection = new autobahn.Connection({
      url: config.wamp.url,
      realm: config.wamp.realm,
    });
    connection.onopen = function(session) {
      cb(session)
        .then(function(data) {
          resolve(data);
        }, function(err) {
          reject(err);
        });
    };
    connection.open();
  });
}

class WKProvider {
  /**
   * Create a new WKProvider instance
   * @param {object} params - object parameters
   * @param {object} params.wamp - wamp object parameters over crossbar.io
   * @param {string} params.wamp.url - wamp crossbar.io host
   * @param {string} params.wamp.realm - wamp crossbar.io realm
   * @param {object} params.kue - kue object parameters, refer to https://github.com/Automattic/kue
   */
  constructor(params) {
    const self = this;
    const pattern = {
      wamp: {
        optional: true,
        type: 'object',
        defaultTo: {
          url: 'ws://127.0.0.1:8080/ws',
          realm: 'realm1',
        },
      },
      kue: {
        optional: true,
        type: 'object',
        defaultTo: {
          prefix: 'sqr',
          redis: {
            port: 6379,
            host: '127.0.0.1',
          },
        },
      },
    };
    const p = validate(params, pattern);
    config.wamp = p.wamp;
    config.kue = p.kue;
    self.connection = {
      queue: null,
    };
    self.rejects = [];
  }

  reject() {
    const self = this;
    for (const id in self.rejects) {
      if (self.rejects.hasOwnProperty(id)) {
        self.rejects[id]();
        delete self.rejects[id];
      }
    }
  }

  connect() {
    const self = this;
    if (self.connection.queue === null) {
      self.connection.queue = kue.createQueue(config.kue);
      self.connection.queue.on( 'error', function(err) {
        console.error('Oops... ');
        self.reject();
      });
    }
    return Promise.resolve(self.connection);
  }

  /**
   * Produce a message in a queue
   * @param {object} connection - connection object
   * @param {object} params - object parameters
   * @param {string} params.queue - the queue name where to produce the message
   * @param {object} params.json - the message to produce as json
   * @return {object} - promise
   */
  produce(connection, params) {
    const self = this;
    return new Promise((resolve, reject) => {
      const id = shortid.generate();
      self.rejects[id] = reject;
      try {
        const job = connection.queue.create(params.queue, params.json)
          .save(function(err) {
            if (err) {
              reject(err);
              delete self.rejects[id];
            } else {
              // console.log('wampKue => Saved job with id ' + job.id);
              console.log('wampKue => Produced new message: ', params.json);
              resolve('ok');
              delete self.rejects[id];
            }
          });
      } catch (e) {
        reject(e);
        delete self.rejects[id];
      }
    });
  }

  /**
   * Consume a message from a queue
   * @param {object} connection - connection object
   * @param {object} params - object parameters
   * @param {string} params.queue - the queue name where to produce the message
   * @param {function} params.cb - callback function to run after consuming a message
   * @return {object} - promise
   */
  consume(connection, params) {
    return new Promise((resolve, reject) => {
      try {
        connection.queue.process(params.queue, function(job, done) {
          console.log('Found task, processing...');
          const res = params.cb(job.data);
          if (res instanceof Promise) {
            res.then(function() {
              done();
            }, function(err) {
              console.error(err);
            });
          } else {
            done();
          }
        });
        resolve('ok');
      } catch (e) {
        reject(e);
      }
    });
  }

  /**
   * Publish a message to a chanel
   * @param {object} params - object parameters
   * @param {string} params.key - the chanel key name where to publish the message
   * @param {object} params.json - the message to publish in json format
   * @return {object} - promise
   */
  publish(connection, params) {
    return exec(function(session) {
      return new Promise((resolve) => {
        session.publish(params.key, [params.json]);
        resolve('ok');
      });
    });
  }

  /**
   * Subscribe to messages from a chanel
   * @param {object} params - object parameters
   * @param {string} params.key - the chanel key name where to listen to messages
   * @param {function} params.cb - callback function to run after receiving a message
   * @return {object} - promise
   */
  subscribe(connection, params) {
    return exec(function(session) {
      return new Promise((resolve, reject) => {
        session.subscribe(params.key, function(data) {
          let json = data;
          if (Array.isArray(data) && data.length && data[0]) {
            json = data[0];
          }
          params.cb(json);
        }).then(function() {
          console.log('Subscribed to ' + params.key);
          resolve('ok');
        }, function(err) {
          console.error('Failed to subscribe to ' + params.key, err);
          reject(err);
        });
      });
    });
  }

}

exports = module.exports = WKProvider;
