'use strict';

/**
 * Not acknowledge a message in a queue, put it back to the queue
 * @param {string} ackId - id of the message to acknowledge
 * @param {object} that - reference to main class
 * @returns {Promise}
 */
module.exports = function(ackId, that) {
  return {
    params: {
      ackId: ackId,
    },
    pattern: {
      ackId: 'string',
    },
    cb: (vp) => {
      return new Promise((resolve, reject) => {
        try {
          if (that.messages.hasOwnProperty(vp.ackId)) {
            that.channel.nack(that.messages[vp.ackId].msg);
            resolve();
          } else {
            reject(`Can't find message with id '${vp.ackId}' for acknowledgement`);
          }
        } catch (e) {
          reject(e);
        }
      });
    },
  };
};
