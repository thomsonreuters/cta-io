'use strict';

const q = require('q');
const common = require('../common.js');
const amqp = require('amqplib/callback_api');

function RQProvider() {

}

RQProvider.prototype = {

  produce: function(params) {
    const deferred = q.defer();
    amqp.connect('amqp://localhost', function(err1, conn) {
      conn.createChannel(function(err2, ch) {
        ch.assertQueue(params.queue, {durable: true});
        ch.sendToQueue(params.queue, common.jsonToBuffer(params.json), {persistent: true});
        console.log('\n[x] Produced new message: ', params.json);
        deferred.resolve();
      });
      setTimeout(function() {
        conn.close();
      }, 500);
    });
    return deferred.promise;
  },

  consume: function(params) {
    const deferred = q.defer();
    amqp.connect('amqp://localhost', function(err1, conn) {
      conn.createChannel(function(err2, ch) {
        ch.assertQueue(params.queue, {durable: true});
        ch.prefetch(1);
        console.log('\n[*] Waiting for messages in queue "%s"', params.queue);
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
    amqp.connect('amqp://localhost', function(err1, conn) {
      conn.createChannel(function(err2, ch) {
        ch.assertExchange(params.ex, 'topic', {durable: false});
        ch.publish(params.ex, params.key, common.jsonToBuffer(params.json));
        console.log('\n[x] Published new message: ', params);
        deferred.resolve(params);
      });
      setTimeout(function() {
        conn.close();
      }, 500);
    });
    return deferred.promise;
  },

  subscribe: function(params) {
    const deferred = q.defer();
    amqp.connect('amqp://localhost', function(err1, conn) {
      conn.createChannel(function(err2, ch) {
        ch.assertExchange(params.ex, 'topic', {durable: false});
        ch.assertQueue('', {exclusive: true}, function(err, queue) {
          console.log('\n[*] Subscribed, waiting for messages...');
          ch.bindQueue(queue.queue, params.ex, params.key);
          ch.consume(queue.queue, function(msg) {
            console.log('\nConsuming new message: ', common.bufferToJSON(msg.content));
            params.fct(msg);
          }, {noAck: true});
          deferred.resolve(params);
        });
      });
    });
    return deferred.promise;
  },

};

exports = module.exports = RQProvider;
