'use strict';

/**
 * Reconnect RabbitMQ when connection is lost
 * @private
 */
module.exports = function(that) {
  if (that.reconnecting === true) {
    that.logger.debug('RabbitMQ is already reconnecting.');
    return;
  }
  that.logger.debug('Reconnecting RabbitMQ...');
  that.reconnecting = true;
  const interval = setInterval(function() {
    that._connect(true)
      .then(function() {
        clearInterval(interval);
        that.reconnecting = false;
        that.logger.info('RabbitMQ provider has been reconnected.');
        that._reconnectConsumers();
      });
  }, that.config.reconnectAfter);
};
