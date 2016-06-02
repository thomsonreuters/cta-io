'use strict';

const co = require('co');
const Brick = require('cta-brick');
const IoLib = require('cta-io');

class IoBrick extends Brick {
  constructor(cementHelper, config) {
    super(cementHelper, config);
    const that = this;
    const provider = that.properties.provider.name || 'rabbitmq';
    const options = that.properties.provider.options || {};
    that.queue = that.properties.queue || 'default_queue';
    that.io = new IoLib(provider, options, that.logger);
    that.storeMode = false;
    that.interval = null;
  }

  start() {
    super.start();
    const that = this;
    if (that.properties.start) {
      const method = that.properties.start.method;
      const params = that.properties.start.params;
      that.io[method](params)
      .then((data) => {
        that.logger.debug(data);
      }, (err) => {
        that.logger.error(err);
      });
    }
  }

  validate(context) {
    return Promise.resolve(context);
  }

  process(context) {
    const that = this;
    return co(function* processCoroutine() {
      if (context.data.nature.type === 'execution' && context.data.nature.quality === 'acknowledge') {
        const res = yield that.ack(context);
        context.emit('done', that.name, res);
      } else if (context.data.nature.type === 'queue' && context.data.nature.quality === 'get') {
        const res = yield that.get(context);
        const noMoreMessage = (res.result.json === null);
        context.emit('done', that.name, noMoreMessage);
      } else {
        const res = yield that.produce(context);
        context.emit('done', that.name, res);
        // that.logger.error('unknown data contract');
      }
    }).catch((err) => {
      context.emit('reject', that.name, err);
      context.emit('error', that.name, err);
    });
  }
}

module.exports = IoBrick;
