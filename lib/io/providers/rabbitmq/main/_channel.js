'use strict';

/**
 * Try to recreate a RabbitMQ channel each config.reChannelAfter ms
 * @param {object} that - reference to main class
 */
function reChannel(that) {
  if (that.reChannel === true) {
    that.logger.debug('RabbitMQ is already trying to recreate a channel...');
    return;
  }
  that.reChannel = true;
  that.logger.debug('Recreating RabbitMQ channel...');
  const interval = setInterval(function() {
    that._channel(true)
      .then(function() {
        clearInterval(interval);
        that.reChannel = false;
        that.logger.info('RabbitMQ channel recreated.');
      });
  }, that.config.reChannelAfter);
}

/**
 * Create RabbitMQ channel
 * @param {object} that - reference to main class
 * @param {Boolean} force - weather to force channel creation or return existing channel
 * @return {object} - promise
 */

module.exports = function _channel(force, that) {
  return new Promise((resolve, reject) => {
    try {
      if (!that.connection) {
        reChannel(that);
        return reject('There is no RabbitMQ connection to create a channel');
      }
      if (force !== true && that.channel) {
        return resolve();
      }
      that.connection.createConfirmChannel(function(chErr, channel) {
        if (chErr) {
          that.logger.debug('RabbitMQ channel creation error: ', chErr);
          reChannel(that);
          return reject(chErr);
        }
        that.logger.debug('Created new RabbitMQ channel');
        channel.on('close', function() {
          that.channel = null;
          that.logger.debug('RabbitMQ channel close event');
          that._channel(false)
            .catch(function(err) {
              that.logger.error(err);
            });
        });
        channel.on('error', function(err) {
          that.logger.debug('RabbitMQ channel error event: ', err);
        });
        channel.on('return', function(msg) {
          that.logger.debug('RabbitMQ channel return event: ', msg);
        });
        channel.on('drain', function() {
          that.logger.debug('RabbitMQ channel drain event');
        });
        that.channel = channel;
        resolve();
      });
    } catch (e) {
      reject(e);
    }
  });
};
