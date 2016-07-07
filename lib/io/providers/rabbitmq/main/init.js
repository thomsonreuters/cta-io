'use strict';

/**
 * Init RabbitMQ connection & channel
 * @param {object} that - reference to main class
 * @private
 */
module.exports = {
  key: '_init',
  fn: (that) => {
    return new Promise((resolve, reject) => {
      try {
        if (that.connection && that.channel) {
          return resolve();
        }
        that._connect(false)
          .then(() => {
            return that._channel(false);
          })
          .then(() => {
            resolve();
          })
          .catch((err) => {
            reject(err);
          });
      } catch (e) {
        reject(e);
      }
    });
  },
};
