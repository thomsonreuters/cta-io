'use strict';

/**
 * default configuration for RabbitMQ Provider
 * @type {{url: string}} - RabbitMQ host url
 */

module.exports = {
  url: 'amqp://localhost?heartbeat=60',
};
