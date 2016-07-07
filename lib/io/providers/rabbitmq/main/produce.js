'use strict';

/**
 * Produce a message in a queue
 * @param {object} params - object of parameters
 * @param {string} params.queue - the queue name where to produce the message
 * @param {object} params.json - the message to produce as json
 * @param {object} that - reference to main class
 * @return {object} - promise
 */

module.exports = (params, that) => {
  return {
    params: params,
    pattern: {
      queue: 'string',
      json: 'object',
    },
    cb: (vp) => {
      return new Promise((resolve, reject) => {
        that.channel.assertQueue(vp.queue, {durable: true, autoDelete: false}, (qErr, qData) => {
          if (qErr) {
            return reject(qErr);
          }
          that.channel.sendToQueue(vp.queue, that._jsonToBuffer(vp.json), {persistent: true}, (sErr) => {
            if (sErr) {
              return reject(sErr);
            }
            that.logger.debug('Produced new message: ', vp.json);
            resolve(qData);
          });
        });
      });
    },
  };
};
