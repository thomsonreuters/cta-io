'use strict';

/**
 * Cancel a consumer
 * @param {string} queue - queue name
 * @param {object} that - reference to main class
 * @return {object} - promise
 */
module.exports = function info(queue, that) {
  return {
    params: {
      queue: queue,
    },
    pattern: {
      queue: 'string',
    },
    cb: (vp) => {
      return new Promise((resolve, reject) => {
        that.channel.assertQueue(vp.queue, null, function(err, data) {
          if (err) {
            return reject(err);
          }
          resolve(data);
        });
      });
    },
  };
};
