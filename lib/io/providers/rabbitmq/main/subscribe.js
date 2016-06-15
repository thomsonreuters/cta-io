'use strict';

const _ = require('lodash');

/**
 * Subscribe to messages from a chanel
 * @param {object} params - object parameters
 * @param {string} params.queue - the chanel key name where to listen to messages
 * @param {function} params.cb - callback function to run after receiving a message, it takes the received json msg as a param
 * @param {string} params.ack - ack mode:
 * - if 'auto': ack as soon as the message is consumed
 * - if 'resolve': ack as soon as the callback is resolved
 * - else you should ack manually by calling provider's ack method
 * @param {object} that - reference to main class
 * @return {object} - promise
 */
module.exports = function(params, that) {
  return {
    params: params,
    pattern: {
      queue: 'string',
      cb: 'function',
      ack: {
        optional: true,
        type: 'string',
        defaultTo: 'resolve',
      },
    },
    cb: (vp) => {
      return new Promise((resolve, reject) => {
        that.channel.assertExchange(vp.queue, 'fanout', {durable: true, autoDelete: false}, function(xErr, xData) {
          if (xErr) {
            return reject(xErr);
          }
          that.channel.assertQueue(vp.queue, {durable: true, autoDelete: false}, function(qErr, qData) {
            if (qErr) {
              return reject(qErr);
            }
            that.channel.bindQueue(qData.queue, vp.queue, '', {}, function(bErr) {
              if (bErr) {
                return reject(bErr);
              }
              that.channel.consume(qData.queue, function(msg) {
                const json = that._processMsg(msg, !/^auto$|^resolve$/.test(vp.ack));
                that.logger.debug('subscribe: received new message, ', json);
                const res = vp.cb(json);
                if (res instanceof Promise) {
                  res.then(function() {
                    that.logger.debug('resolved subscribe callback');
                    if (vp.ack === 'resolve') {
                      that.channel.ack(msg);
                      that.logger.debug('acknowledged message: ', json);
                    }
                  }, function(cbErr) {
                    that.logger.debug('cb error: ', cbErr);
                  });
                } else {
                  that.logger.debug('resolved subscribe callback');
                  if (vp.ack === 'resolve') {
                    that.channel.ack(msg);
                    that.logger.debug('acknowledged message: ', json);
                  }
                }
              }, {noAck: (vp.ack === 'auto')}, function(cErr, cData) {
                if (cErr) {
                  return reject(cErr);
                }
                that.logger.debug(`subscribe: starting new consumer with id ${cData.consumerTag}, waiting for messages in queue ${vp.queue}`);
                that.consumers[cData.consumerTag] = {
                  method: 'subscribe',
                  params: params,
                };
                resolve(_.assign(xData, qData, cData));
              });
            });
          });
        });
      });
    },
  };
};
