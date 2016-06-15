'use strict';

const shortid = require('shortid');

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
module.exports = function(msg, save, that) {
  const json = that._bufferToJSON(msg.content);
  if (!json.id) {
    json.id = shortid.generate();
  }
  if (save === true) {
    that.messages[json.id] = {
      msg: msg,
      timestamp: Date.now(),
    };
  }
  return json;
};
