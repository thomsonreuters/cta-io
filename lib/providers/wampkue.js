'use strict';

const q = require('q');
const autobahn = require('autobahn');
const kue = require('kue');
const validate = require('../validate/');

const config = {};

/**
 * Execute a wamp method after authentication
 * @param {function} cb - wamp method to run, takes wamp session as param
 * @return {object} - promise
 */
function exec(cb) {
  const deferred = q.defer();
  const connection = new autobahn.Connection({
    url: config.wamp.url,
    realm: config.wamp.realm,
  });
  connection.onopen = function(session) {
    cb(session)
      .then(function(data) {
        deferred.resolve(data);
      }, function(err) {
        deferred.reject(err);
      });
  };
  connection.open();
  return deferred.promise;
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
    const res = validate(params, pattern);
    if (res !== true) {
      throw new Error(res);
    }
    config.wamp = params.wamp;
    config.kue = params.kue;
  }

  /**
   * Produce a message in a queue
   * @param {object} params - object parameters
   * @param {string} params.queue - the queue name where to produce the message
   * @param {object} params.json - the message to produce as json
   * @return {object} - promise
   */
  produce(params) {
    const deferred = q.defer();
    const queue = kue.createQueue(config.kue);
    const job = queue.create(params.queue, params.json)
      .save(function(err) {
        if (err) {
          deferred.reject(err);
        } else {
          console.log('Saved job with id ' + job.id);
          deferred.resolve();
        }
      });
    return deferred.promise;
  }

  /**
   * Consume a message from a queue
   * @param {object} params - object parameters
   * @param {string} params.queue - the queue name where to produce the message
   * @param {function} params.cb - callback function to run after consuming a message
   * @return {object} - promise
   */
  consume(params) {
    const deferred = q.defer();
    const queue = kue.createQueue(config.kue);
    queue.process(params.queue, function(job, done) {
      console.log('Found task, processing...');
      params.cb(job.data)
        .then(function() {
          done();
          deferred.resolve();
        }, function(err) {
          deferred.reject(err);
        });
    });
    return deferred.promise;
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
      const deferred = q.defer();
      session.publish(params.key, [params.json]);
      deferred.resolve();
      return deferred.promise;
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
      const deferred = q.defer();
      session.subscribe(params.key, function(data) {
        let json = data;
        if (Array.isArray(data) && data.length && data[0]) {
          json = data[0];
        }
        params.cb(json);
      }).then(function() {
        console.log('Subscribed to ' + params.key);
        deferred.resolve();
      }, function(err) {
        console.error('Failed to subscribe to ' + params.key, err);
        deferred.reject(err);
      });
      return deferred.promise;
    });
  }

}

exports = module.exports = WKProvider;
