'use strict';

const amqp = require('amqplib/callback_api');

/**
 * Try to reconnect RabbitMQ each config.reConnectAfter ms
 * @param {object} that - reference to main class
 * @return {object} - promise
 */
function reConnect(that) {
  if (that.reconnecting === true) {
    that.logger.debug('RabbitMQ is already trying to reconnect...');
    return;
  }
  that.reconnecting = true;
  that.logger.debug('Reconnecting RabbitMQ...');
  const interval = setInterval(() => {
    that._connect(true)
      .then(() => {
        clearInterval(interval);
        that.reconnecting = false;
        that.logger.info('RabbitMQ provider has been reconnected.');
        that._reconnectConsumers();
      });
  }, that.config.reConnectAfter);
}

/**
 * Connect RabbitMQ
 * @param {Boolean} force - weather to force connection or return existing connection
 * @param {object} that - reference to main class
 * @return {object} - promise
 * @private
 */
module.exports = {
  key: '_connect',
  fn: (force, that) => {
    return new Promise((resolve, reject) => {
      try {
        if (force !== true && that.connection) {
          return resolve();
        }
        that.logger.debug('Connecting to rabbitMQ...');
        amqp.connect(that.config.url, (connErr, connection) => {
          if (connErr) {
            that.logger.debug('RabbitMQ connection error: ', connErr);
            reConnect(that);
            return reject(connErr);
          }
          that.logger.debug('Connected to rabbitMQ, host: ', connection.connection.stream._host);
          connection.on('close', () => {
            that.connection = null;
            that.logger.debug('RabbitMQ connection close event');
            reConnect(that);
          });
          connection.on('error', (err) => {
            that.logger.debug('RabbitMQ connection error event: ', err);
          });
          connection.on('blocked', (reason) => {
            that.logger.debug('RabbitMQ connection blocked event: ', reason);
          });
          connection.on('unblocked', () => {
            that.logger.debug('RabbitMQ connection unblocked event');
          });
          that.connection = connection;
          resolve();
        });
      } catch (e) {
        reject(e);
      }
    });
  },
};
