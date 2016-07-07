'use strict';

/**
 * Get a message from a queue
 * @param {object} params - object parameters
 * @param {string} params.queue - the queue name where to get the message
 * @param {string} params.ack - ack mode
 * if 'auto': ack as soon as the message is consumed
 * else you should ack manually by calling provider's ack method
 * @param {object} that - reference to main class
 * @return {object}
 */

module.exports = (params, that) => {
  return {
    params: params,
    pattern: {
      queue: 'string',
      ack: {
        optional: true,
        type: 'string',
        defaultTo: '',
      },
    },
    cb: (vp) => {
      return new Promise((resolve, reject) => {
        that.channel.prefetch(1);
        that.logger.debug('Getting a message in queue "%s"', vp.queue);
        that.channel.get(vp.queue, {noAck: (vp.ack === 'auto')}, (getErr, msg) => {
          if (getErr) {
            return reject(getErr);
          }
          let json = {};
          if (!msg) {
            json = null;
            that.logger.debug('get: no more messages in queue "%s"', vp.queue);
          } else {
            json = that._processMsg(msg, (vp.ack !== 'auto'));
            that.logger.debug('get: received new message, ', json);
          }
          resolve({
            json: json,
          });
        });
      });
    },
  };
};
