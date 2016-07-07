'use strict';

const tools = require('cta-tools');

/**
 * Execute a main method
 * first validate main method params,
 * then check RabbitMQ connection,
 * then execute the method
 * ensure to return a same pattern
 * @param input - object of parameters
 * @param input.params - main method parameters
 * @param input.pattern - main method parameters pattern for validation
 * @param input.cb - main method to execute
 * @param {object} that - reference to main class
 * @returns {Promise}
 * @private
 */
module.exports = {
  key: '_exec',
  fn: (input, that) => {
    return new Promise((resolve, reject) => {
      try {
        const _input = tools.validate(input, {
          params: 'object',
          pattern: 'object',
          cb: 'function',
        }).output;
        const vp = tools.validate(_input.params, _input.pattern).output;
        that._init()
          .then(() => {
            return _input.cb(vp);
          })
          .then((result) => {
            resolve({result: result, params: vp});
          })
          .catch((err) => {
            that.logger.error(err);
            reject(err);
          });
      } catch (e) {
        reject(e);
      }
    });
  },
};
