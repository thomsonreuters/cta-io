'use strict';

const q = require('q');
const common = require('../common.js');
const amqp = require('amqplib/callback_api');

class RQProvider {

  constructor(params) {
    this.url = (params && 'url' in params) ? params.url : 'amqp://localhost';
  }

  init(cb) {
    const deferred = q.defer();
    amqp.connect(this.url, function(connErr, conn) {
      if (connErr) {
        deferred.reject(connErr);
      } else {
        conn.createChannel(function(chErr, ch) {
          if (chErr) {
            deferred.reject(chErr);
          } else {
            cb(ch, conn)
            .then(function(data) {
              deferred.resolve(data);
            }, function(err) {
              deferred.reject(err);
            });
          }
        });
      }
    });
    return deferred.promise;
  }

  produce(params) {
    return this.init(function(ch, conn) {
      const deferred = q.defer();
      ch.assertQueue(params.queue, {durable: true});
      ch.sendToQueue(params.queue, common.jsonToBuffer(params.json), {persistent: true});
      console.log('\n[x] Produced new message: ', params.json);
      setTimeout(function() {
        conn.close();
        deferred.resolve();
      }, 500);
      return deferred.promise;
    });
  }

  consume(params) {
    return this.init(function(ch) {
      const deferred = q.defer();
      ch.assertQueue(params.queue, {durable: true});
      ch.prefetch(1);
      console.log('\n[*] Waiting for messages in queue "%s"', params.queue);
      ch.consume(params.queue, function(msg) {
        const json = common.bufferToJSON(msg.content);
        params.cb(json)
          .then(function(data) {
            ch.ack(msg);
            deferred.resolve(data);
          }, function(err) {
            deferred.reject(err);
          });
      }, {noAck: false});
      return deferred.promise;
    });
  }

  publish(params) {
    return this.init(function(ch, conn) {
      const deferred = q.defer();
      ch.assertExchange(params.ex, 'topic', {durable: false});
      ch.publish(params.ex, params.key, common.jsonToBuffer(params.json));
      console.log('\n[x] Published new message: ', params);
      setTimeout(function() {
        conn.close();
        deferred.resolve(params);
      }, 500);
      return deferred.promise;
    });
  }

  subscribe(params) {
    return this.init(function(ch) {
      const deferred = q.defer();
      ch.assertExchange(params.ex, 'topic', {durable: false});
      ch.assertQueue('', {exclusive: true}, function(err, queue) {
        console.log('\n[*] Subscribed, waiting for messages...');
        ch.bindQueue(queue.queue, params.ex, params.key);
        ch.consume(queue.queue, function(msg) {
          const json = common.bufferToJSON(msg.content);
          console.log('\nConsuming new message: ', json);
          params.cb(json);
        }, {noAck: true});
        deferred.resolve(params);
      });
      return deferred.promise;
    });
  }

}

exports = module.exports = RQProvider;
