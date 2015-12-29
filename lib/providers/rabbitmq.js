'use strict';

const q = require('q');
const amqp = require('amqplib/callback_api');
const validate = require('../validate/');

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

  exec(params, pattern, cb) {
    const deferred = q.defer();
    if (params && pattern) {
      const res = validate(params, pattern);
      if (res !== true) {
        deferred.reject(res);
        return deferred.promise;
      }
    }
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
    const pattern = {
      mq_persistent: {
        optional: true,
        type: 'boolean',
        defaultTo: true,
      },
      mq_durable: {
        optional: true,
        type: 'boolean',
        defaultTo: true,
      },
    };

    function cb(ch, conn) {
      const deferred = q.defer();
      ch.assertQueue(params.queue, {durable: params.mq_durable});
      ch.sendToQueue(params.queue, tools.jsonToBuffer(params.json), {persistent: params.mq_persistent});
      console.log('\nProduced new message: ', params.json);
      setTimeout(function() {
        conn.close();
        deferred.resolve();
      }, 500);
      return deferred.promise;
    }

    return this.exec(params, pattern, cb);
  }

  consume(params) {
    const pattern = {
      mq_noAck: {
        optional: true,
        type: 'boolean',
        defaultTo: false,
      },
      mq_prefetch: {
        optional: true,
        type: 'number',
        defaultTo: 1,
      },
      mq_durable: {
        optional: true,
        type: 'boolean',
        defaultTo: true,
      },
    };

    function cb(ch) {
      const deferred = q.defer();
      ch.assertQueue(params.queue, {durable: params.mq_durable});
      ch.prefetch(params.mq_prefetch);
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
      }, {noAck: params.mq_noAck});
      return deferred.promise;
    }

    return this.exec(params, pattern, cb);
  }

  publish(params) {
    const pattern = {
      mq_ex_name: {
        optional: true,
        type: 'string',
        defaultTo: 'default',
      },
      mq_ex_type: {
        optional: true,
        type: 'string',
        defaultTo: 'topic',
      },
      mq_durable: {
        optional: true,
        type: 'boolean',
        defaultTo: false,
      },
    };

    function cb(ch, conn) {
      const deferred = q.defer();
      ch.assertExchange(params.mq_ex_name, params.mq_ex_type, {durable: params.mq_durable});
      ch.publish(params.mq_ex_name, params.key, tools.jsonToBuffer(params.json));
      console.log('\nPublished new message: ', params);
      setTimeout(function() {
        conn.close();
        deferred.resolve(params);
      }, 500);
      return deferred.promise;
    }

    return this.exec(params, pattern, cb);
  }

  subscribe(params) {
    const pattern = {
      mq_ex_name: {
        optional: true,
        type: 'string',
        defaultTo: 'default',
      },
      mq_ex_type: {
        optional: true,
        type: 'string',
        defaultTo: 'topic',
      },
      mq_durable: {
        optional: true,
        type: 'boolean',
        defaultTo: false,
      },
    };

    function cb(ch) {
      const deferred = q.defer();
      ch.assertExchange(params.mq_ex_name, params.mq_ex_type, {durable: params.mq_durable});
      ch.assertQueue('', {exclusive: true}, function(err, queue) {
        console.log('\nSubscribed, waiting for messages...');
        ch.bindQueue(queue.queue, params.mq_ex_name, params.key);
        ch.consume(queue.queue, function(msg) {
          const json = tools.bufferToJSON(msg.content);
          console.log('\nConsuming new message: ', json);
          params.cb(json);
        }, {noAck: true});
        deferred.resolve(params);
      });
      return deferred.promise;
    }

    return this.exec(params, pattern, cb);
  }

}

exports = module.exports = RQProvider;
