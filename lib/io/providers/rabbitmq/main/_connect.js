'use strict';

const amqp = require('amqplib/callback_api');

/**
 * Connect RabbitMQ & set connection & channel properties
 * @param {Boolean} force - weather to force connection or return existing connection
 * @param {object} that - reference to main class
 * @return {object} - promise
 */

module.exports = function(force, that) {
  return new Promise((resolve, reject) => {
    if (force !== true && that.connection && that.channel) {
      return resolve(that.channel);
    }
    that.logger.debug('Connecting to rabbitMQ...');
    amqp.connect(that.config.url, function(connErr, connection) {
      if (connErr) {
        that.logger.debug('RabbitMQ connection error');
        that._reconnect();
        return reject(connErr);
      }
      that.logger.debug('Connected to rabbitMQ, host: ', connection.connection.stream._host);
      connection.on('close', function() {
        that.logger.debug('RabbitMQ connection close event');
        that.connected = false;
        that._reconnect();
      });
      connection.on('error', function(err) {
        that.logger.debug('RabbitMQ connection error event: ', err);
      });
      that.connection = connection;
      that.connected = true;
      connection.createConfirmChannel(function(chErr, channel) {
        if (chErr) {
          return reject(chErr);
        }
        that.logger.debug('Created new RabbitMQ channel');
        channel.on('close', function() {
          that.logger.debug('RabbitMQ channel close event');
          that._reconnect();
        });
        channel.on('error', function(err) {
          that.logger.debug('RabbitMQ channel error event: ', err);
        });
        that.channel = channel;
        resolve(that.channel);
      });
    });
  });
};
