'use strict';

/**
 * Not acknowledge a message in a queue, put it back to the queue
 * @param {string} params - object of parameters
 * @param {string} params.id - id of the message to acknowledge if params.msg not provided
 * @param {object} params.msg - rabbitMQ message to acknowledge if params.id not provided
 * @param {boolean} params.requeue - RabbitMQ option, weather to requeue the msg or not
 * @param {object} that - reference to main class
 * @returns {object}
 */
module.exports = (params, that) => {
  return {
    params: params,
    pattern: {
      id: {
        type: 'string',
        optional: true,
        defaultTo: '',
      },
      msg: {
        type: 'object',
        optional: true,
        defaultTo: null,
      },
      requeue: {
        type: 'boolean',
        optional: true,
        defaultTo: true,
      },
    },
    cb: (vp) => {
      return new Promise((resolve, reject) => {
        try {
          if (vp.msg !== null) {
            that.channel.nack(vp.msg);
            resolve();
          } else if (vp.id !== '' && that.messages.hasOwnProperty(vp.id)) {
            that.channel.nack(that.messages[vp.id].msg);
            resolve();
          } else {
            reject(`Invalid message for acknowledgement '${vp.id}', '${vp.msg}'`);
          }
        } catch (e) {
          reject(e);
        }
      });
    },
  };
};
