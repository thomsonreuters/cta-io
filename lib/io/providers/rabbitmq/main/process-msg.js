'use strict';

const shortId = require('shortid');

/**
 * Process a consumed message:
 * - transform the msg buffer into json
 * - generate an id if necessary
 * - save the message for future acknowledgement if necessary
 * @param {object} msg - consumed message
 * @param {boolean} save - weather to save the message for future acknowledgement
 * @returns {object}
 * @private
 */
module.exports = {
  key: '_processMsg',
  fn: (msg, save, that) => {
    let json = null;
    try {
      json = that._bufferToJSON(msg.content);
      const acked = json.id && that.acked[json.id];
      if (acked) {
        that.logger.debug(`processMsg: skipping already acked message with id "${json.id}"`);
        that.nack({
          msg: msg,
          requeue: false,
        });
        json = null;
      }
      if (json !== null && !json.id) {
        json.id = shortId.generate();
      }
      if (save === true && !acked) {
        that.messages[json.id] = {
          msg: msg,
          timestamp: Date.now(),
        };
      }
    } catch (e) {
      that.logger.error(e);
    }
    return json;
  },
};
