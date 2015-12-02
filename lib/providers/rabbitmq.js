'use strict';

const q = require('q');
const common = require('../common.js');
const amqp = require('amqplib/callback_api');

function RQProvider() {

}

RQProvider.prototype = {

  produce: function(params) {
    const deferred = q.defer();
    try {
      amqp.connect('amqp://localhost', function(err1, conn) {
        conn.createChannel(function(err2, ch) {
          ch.assertQueue(params.queue, {durable: true});
          ch.sendToQueue(params.queue, common.jsonToBuffer(params.json), {persistent: true});
          console.log('\n[x] Sent', params.json);
          deferred.resolve();
        });
        setTimeout(function() {
          conn.close();
        }, 500);
      });
    } catch (err) {
      deferred.reject(err);
    }
    return deferred.promise;
  },

  consume: function(params) {
    const deferred = q.defer();
    amqp.connect('amqp://localhost', function(err1, conn) {
      conn.createChannel(function(err2, ch) {
        ch.assertQueue(params.queue, {durable: true});
        ch.prefetch(1);
        console.log('\n[*] Waiting for messages in %s.', params.queue);
        ch.consume(params.queue, function(msg) {
          params.fct(msg)
            .then(function(data) {
              ch.ack(msg);
              deferred.resolve(data);
            }, function(err3) {
              deferred.reject(err3);
            });
        }, {noAck: false});
      });
    });
    return deferred.promise;
  },

  publish: function(params) {
    const deferred = q.defer();
    try {
      deferred.resolve(params);
    } catch (err) {
      deferred.reject(err);
    }
    return deferred.promise;
  },

  subscribe: function(params) {
    const deferred = q.defer();
    try {
      deferred.resolve(params);
    } catch (err) {
      deferred.reject(err);
    }
    return deferred.promise;
  },

};

exports = module.exports = RQProvider;
