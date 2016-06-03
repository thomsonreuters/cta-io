'use strict';

const co = require('co');
const Brick = require('cta-brick');
const IoLib = require('./io');

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
    return new Promise((resolve, reject) => {
      if (that.properties.start) {
        const method = that.properties.start.method;
        const params = that.properties.start.params;
        that.io[method](params)
          .then((data) => {
            that.logger.debug(data);
            return resolve(data);
          }, (err) => {
            that.logger.error(err);
            return reject(err);
          });
      } else {
        resolve('nothing to do');
      }
    });
  }

  validate(context) {
    return Promise.resolve(context);
  }

  process(context) {
    const that = this;
    return co(function* processCoroutine() {
    // ack ----------------------------------------------
      if (context.data.nature.type === 'execution' && context.data.nature.quality === 'acknowledge') {
        const res = yield that.io.ack(context.data.payload.jobid);
        context.emit('done', that.name, res);

    // get -----------------------------------------------
      } else if (context.data.nature.type === 'queue' && context.data.nature.quality === 'get') {
        if (!context.data.payload.queue) {
          that.logger.warn('No queue passed in the payload, using default queue %s', that.queue);
        }
        const res = yield that.io.get(context.data.payload.queue || that.queue);
        const json = res.result.json;
        if (json !== null && !(typeof json === 'object' && 'id' in json)) {
          throw new Error('Missing id in consumed json');
        }
        context.emit('done', that.name, json === null);

    // produce ------------------------------------------
      } else if (context.data.payload) {
        const res = yield that.produce(context.data.payload);
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
