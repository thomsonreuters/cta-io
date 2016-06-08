'use strict';

/**
 * default configuration for RabbitMQ Provider
 * @type {{url: string}} - RabbitMQ host url
 */

module.exports = {
  url: 'amqp://localhost?heartbeat=60',
  reconnectAfter: 60000,  // 60 * 1000,
  clearInterval: 3600000, // 60 * 60 * 1000,
  clearOffset: 86400000,  // 24 * 60 * 60 * 1000,
};
