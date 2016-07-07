'use strict';

/**
 * Reconnect consumers after RabbitMQ is reconnected
 * @private
 */
module.exports = {
  key: '_reconnectConsumers',
  fn: (that) => {
    const keys = Object.keys(that.consumers);
    const L = keys.length;
    if (L === 0) {
      that.logger.info('No consumers detected');
    } else {
      that.logger.info(`${L} consumer(s) detected, reconnecting them...`);
      for (let i = 0; i < L; i++) {
        const e = that.consumers[keys[i]];
        that[e.method](e.params)
          .then((data) => {
            that.logger.info(`Reconnected consumer with consumerTag "${keys[i]}": `, data);
            delete that.consumers[keys[i]];
          })
          .catch((err) => {
            that.logger.error(`Can't reconnect consumer with consumerTag ${keys[i]}: `, err);
          });
      }
    }
  },
};
