'use strict';

const defaultLogger = require('cta-logger');
const providers = require('./providers');

/**
 * Create a new Io instance
 * @param {string} provider - provider name, refer to list of available providers
 * @param {object} options - provider options, refer to provider's doc
 * @param {object} logger - logger instance
 * @constructor
 */
function Io(provider, options, logger) {
  if (typeof provider !== 'string') {
    throw new Error('Missing provider name');
  }
  if ( !(provider in providers) ) {
    throw new Error('Unknown provider "' + provider + '"');
  }
  return new providers[provider](options, logger || defaultLogger());
}

module.exports = Io;
