'use strict';

/**
 * Housekeeping: remove old messages from memory that have not been acknowledged
 * @private
 */
module.exports = function _houseKeeping(that) {
  setInterval(function() {
    Object.keys(that.messages).forEach(function(id) {
      const offset = Date.now() - that.config.clearOffset;
      if (that.messages[id].timestamp < offset) {
        delete that.messages[id];
      }
    });
    Object.keys(that.acked).forEach(function(id) {
      const offset = Date.now() - that.config.clearOffset;
      if (that.acked[id] < offset) {
        delete that.acked[id];
      }
    });
  }, that.config.clearInterval);
};
