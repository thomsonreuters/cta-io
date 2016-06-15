'use strict';

/**
 * Housekeeping: remove old messages from memory that have not been acknowledged
 * @private
 */
module.exports = function(that) {
  setInterval(function() {
    Object.keys(that.messages).forEach(function(id) {
      const offset = Date.now() - that.config.clearOffset;
      if (that.messages[id].timestamp < offset) {
        delete that.messages[id];
      }
    });
  }, that.config.clearInterval);
};
