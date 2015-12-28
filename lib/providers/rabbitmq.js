'use strict';

const q = require('q');
const amqp = require('amqplib/callback_api');

const tools = {
  bufferToJSON: function(buffer) {
    return JSON.parse(buffer.toString());
  },
  jsonToBuffer: function(json) {
    return new Buffer(JSON.stringify(json));
  },
};

class RQProvider {

  constructor(params) {
    this.url = (params && 'url' in params) ? params.url : 'amqp://localhost';
  }

  exec(cb) {
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
    return this.exec(function(ch, conn) {
      const deferred = q.defer();
      const durable = 'mq_durable' in params ? params.mq_durable : true;
      const persistent = 'mq_persistent' in params ? params.mq_persistent : true;
      ch.assertQueue(params.queue, {durable: durable});
      ch.sendToQueue(params.queue, tools.jsonToBuffer(params.json), {persistent: persistent});
      console.log('\nProduced new message: ', params.json);
      setTimeout(function() {
        conn.close();
        deferred.resolve();
      }, 500);
      return deferred.promise;
    });
  }

  consume(params) {
    return this.exec(function(ch) {
      const deferred = q.defer();
      const durable = 'mq_durable' in params ? params.mq_durable : true;
      const noAck = 'mq_noAck' in params ? params.mq_noAck : false;
      const prefetch = 'mq_prefetch' in params ? params.mq_prefetch : 1;
      ch.assertQueue(params.queue, {durable: durable});
      if (prefetch) {
        ch.prefetch(prefetch);
      }
      console.log('\nWaiting for messages in queue "%s"', params.queue);
      ch.consume(params.queue, function(msg) {
        const json = tools.bufferToJSON(msg.content);
        params.cb(json)
          .then(function(data) {
            ch.ack(msg);
            deferred.resolve(data);
          }, function(err) {
            deferred.reject(err);
          });
      }, {noAck: noAck});
      return deferred.promise;
    });
  }

  publish(params) {
    return this.exec(function(ch, conn) {
      const deferred = q.defer();
      const exName = params.mq_ex_name || 'default';
      const exType = params.mq_ex_type || 'topic';
      const durable = 'mq_durable' in params ? params.mq_durable : false;
      ch.assertExchange(exName, exType, {durable: durable});
      ch.publish(exName, params.key, tools.jsonToBuffer(params.json));
      console.log('\nPublished new message: ', params);
      setTimeout(function() {
        conn.close();
        deferred.resolve(params);
      }, 500);
      return deferred.promise;
    });
  }

  subscribe(params) {
    return this.exec(function(ch) {
      const deferred = q.defer();
      const exName = params.mq_ex_name || 'default';
      const exType = params.mq_ex_type || 'topic';
      const durable = 'mq_durable' in params ? params.mq_durable : false;
      ch.assertExchange(exName, exType, {durable: durable});
      ch.assertQueue('', {exclusive: true}, function(err, queue) {
        console.log('\nSubscribed, waiting for messages...');
        ch.bindQueue(queue.queue, exName, params.key);
        ch.consume(queue.queue, function(msg) {
          const json = tools.bufferToJSON(msg.content);
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
