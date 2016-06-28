'use strict';

const RabbitMQProvider = require('./class');
const defaultLogger = require('cta-logger');
const tools = require('cta-tools');
const defaults = require('./config.defaults');
const singletons = new Map();

/**
 * Returns a (new or same) RabbitMQProvider instance
 * @param {object} config - RabbitMQ configuration
 * @param {string} config.url - RabbitMQ host
 * @param {number} config.reConnectAfter - delay in ms to reconnect RabbitMQ after disconnection
 * @param {number} config.clearInterval - interval in ms to clear old messages that are saved in memory for acknowledgement
 * @param {number} config.clearOffset - time offset in ms to clear old messages
 * @param {boolean} config.newInstance - weather to create a new instance or return an already created one
 * @param {object} logger - logger instance
 * @returns {V}
 */
module.exports = function(config, logger) {
  const _logger = logger || defaultLogger();
  const _config = tools.validate(config, {
    url: {
      optional: true,
      type: 'string',
      defaultTo: defaults.url,
    },
    reConnectAfter: {
      optional: true,
      type: 'number',
      defaultTo: defaults.reConnectAfter,
    },
    reChannelAfter: {
      optional: true,
      type: 'number',
      defaultTo: defaults.reChannelAfter,
    },
    clearInterval: {
      optional: true,
      type: 'number',
      defaultTo: defaults.clearInterval,
    },
    clearOffset: {
      optional: true,
      type: 'number',
      defaultTo: defaults.clearOffset,
    },
    newInstance: {
      optional: true,
      type: 'boolean',
      defaultTo: false,
    },
  }).output;

  const hashString = [_config.url, _config.reConnectAfter, _config.reChannelAfter, _config.clearInterval, _config.clearOffset].join('-');
  let singleton = singletons.get(hashString);

  if (singleton === undefined || _config.newInstance === true) {
    singleton = new RabbitMQProvider(_config, _logger);
  }
  if (_config.newInstance !== true) {
    singletons.set(hashString, singleton);
  }
  return singleton;
};
