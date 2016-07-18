'use strict';

/**
 * Publish a message to be consumed by a subscriber as soon as it is published
 * @param {object} params - object parameters
 * @param {string} params.queue - the queue name where to publish the message
 * @param {object} params.json - the message to publish in json format
 * @param {object} that - reference to main class
 * @return {object}
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
        try {
          that.channel.assertExchange(vp.queue, 'fanout', {durable: true, autoDelete: false}, (aErr, aData) => {
            if (aErr) {
              return reject(aErr);
            }
            that.channel.publish(vp.queue, '', that._jsonToBuffer(vp.json), {persistent: true}, (pErr) => {
              if (pErr) {
                return reject(pErr);
              }
              that.logger.debug('Published new message: ', vp.json);
              resolve(aData);
            });
          });
        } catch (e) {
          reject(e);
        }
      });
    },
  };
};
