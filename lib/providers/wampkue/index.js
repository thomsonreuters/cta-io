'use strict';

const autobahn = require('autobahn');
const kue = require('kue');
const validate = require('../../validate/');

const config = {};

/**
 * Execute a wamp method after authentication
 * @param {function} cb - wamp method to run, takes wamp session as param
 * @return {object} - promise
 * TODO manage reconnection & silo
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
          prefix: 'q',
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
  }

  /**
   * Produce a message in a queue
   * @param {object} params - object parameters
   * @param {string} params.queue - the queue name where to produce the message
   * @param {object} params.json - the message to produce as json
   * @return {object} - promise
   */
  produce(params) {
    return new Promise((resolve, reject) => {
      const queue = kue.createQueue(config.kue);
      const job = queue.create(params.queue, params.json)
        .save(function(err) {
          if (err) {
            reject(err);
          } else {
            console.log('Saved job with id ' + job.id);
            resolve('ok');
          }
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
    return new Promise((resolve, reject) => {
      const queue = kue.createQueue(config.kue);
      queue.process(params.queue, function(job, done) {
        console.log('Found task, processing...');
        params.cb(job.data)
          .then(function() {
            done();
          }, function(err) {
            console.error(err);
          });
      });
      resolve('ok');
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
  subscribe(params) {
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
