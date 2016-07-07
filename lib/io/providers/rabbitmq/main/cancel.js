'use strict';

/**
 * Cancel a consumer
 * @param {string} consumerTag - consumerTag
 * @param {object} that - reference to main class
 * @return {object}
 */
module.exports = (consumerTag, that) => {
  return {
    params: {
      consumerTag: consumerTag,
    },
    pattern: {
      consumerTag: 'string',
    },
    cb: (vp) => {
      return new Promise((resolve, reject) => {
        that.channel.cancel(vp.consumerTag, (err, data) => {
          if (err) {
            return reject(err);
          }
          resolve(data);
        });
      });
    },
  };
};
