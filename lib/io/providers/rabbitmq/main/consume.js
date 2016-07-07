'use strict';

const _ = require('lodash');

/**
 * Consume a message from a queue
 * @param {object} params - object parameters
 * @param {string} params.queue - the queue name where to produce the message
 * @param {function} params.cb - callback function to run after consuming a message
 * @param {string} params.ack - ack mode
 * if 'auto': ack as soon as the message is consumed
 * if 'resolve': ack as soon as the callback is resolved
 * else you should ack manually by calling provider's ack method
 * @param {object} that - reference to main class
 * @return {object} - promise
 */

module.exports = (params, that) => {
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
        that.channel.assertQueue(vp.queue, {durable: true, autoDelete: false}, (qErr, qData) => {
          if (qErr) {
            return reject(qErr);
          }
          that.channel.prefetch(1);
          that.channel.consume(vp.queue, (msg) => {
            if (msg === null) {
              that.logger.info(`Consumer on queue ${vp.queue} has been cancelled.`);
              return;
            }
            const json = that._processMsg(msg, !/^auto$|^resolve$/.test(vp.ack));
            if (json === null) {
              return;
            }
            that.logger.debug('consume: received new message, ', json);
            const res = vp.cb(json);
            if (res instanceof Promise) {
              res.then(() => {
                that.logger.debug('resolved consume callback');
                if (vp.ack === 'resolve') {
                  that.channel.ack(msg);
                  that.logger.debug('acknowledged message: ', json);
                }
              }, (cbErr) => {
                that.logger.debug('cb error: ', cbErr);
              });
            } else {
              that.logger.debug('resolved consume callback');
              if (vp.ack === 'resolve') {
                that.channel.ack(msg);
                that.logger.debug('acknowledged message: ', json);
              }
            }
          }, {noAck: (vp.ack === 'auto')}, (cErr, cData) => {
            if (cErr) {
              return reject(cErr);
            }
            that.logger.debug(`consume: starting new consumer with id ${cData.consumerTag}, waiting for messages in queue ${vp.queue}`);
            that.consumers[cData.consumerTag] = {
              method: 'consume',
              params: params,
            };
            resolve(_.assign(qData, cData));
          });
        });
      });
    },
  };
};
