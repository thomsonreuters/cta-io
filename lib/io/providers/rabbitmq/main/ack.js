'use strict';

/**
 * Acknowledge a message in a queue, remove it from the queue
 * @param {string} ackId - id of the message to acknowledge
 * @param {object} that - reference to main class
 * @returns {object}
 */
module.exports = (ackId, that) => {
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
            if (that.channel) {
              that.channel.ack(that.messages[vp.ackId].msg);
              delete that.messages[vp.ackId];
            }
            that.acked[vp.ackId] = Date.now();
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
