'use strict';

const co = require('co');
const Brick = require('cta-brick');
const IoLib = require('./io');

class Io extends Brick {
  /**
   * Create a new Io instance
   * @param {CementHelper} cementHelper - cementHelper instance
   * @param {BrickConfig} config - cement configuration of the brick
   */
  constructor(cementHelper, config) {
    super(cementHelper, config);
    const that = this;
    const provider = that.properties.provider.name || 'rabbitmq';
    const options = that.properties.provider.options || {};
    that.inputQueue = that.properties.inputQueue || 'input_queue';
    that.outputQueue = that.properties.outputQueue || 'output_queue';
    that.io = new IoLib(provider, options, that.logger);
    that.storeMode = false;
    that.interval = null;
  }

  /**
   * This method is called by Cement when all other Bricks are initialized and ready
   * It implements the start property provided in the configuration
   * Mostly consume messages from an outside queue
   * Then it publishes what has been consumed to the internal channel
   * */
  start() {
    super.start();
    const that = this;
    return new Promise((resolve, reject) => {
      if (that.properties.start) {
        const method = that.properties.start.method;
        const params = that.properties.start.params;
        params.cb = function(json) {
          that.cementHelper.createContext(json).publish();
        };
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

  /**
   * Validates Context properties
   * @param {Context} context - a Context
   * @returns {Promise}
   */
  validate(context) {
    return Promise.resolve(context);
  }

  /**
   * Process the context
   * @param {Context} context - a Context
   */
  process(context) {
    const that = this;
    return co(function* processCoroutine() {
      let data;
      let type;
      let quality;
      let payload;

      if (typeof context === 'object' && 'data' in context && typeof context.data === 'object') {
        data = context.data;
        if ('nature' in context.data && typeof context.data.nature === 'object') {
          if ('type' in context.data.nature) {
            type = context.data.nature.type;
          }
          if ('quality' in context.data.nature) {
            quality = context.data.nature.quality;
          }
        }
        if ('payload' in context.data && typeof context.data.payload === 'object' && context.data.payload !== null) {
          payload = context.data.payload;
        }
      }

      // ack ----------------------------------------------
      if (type === 'execution' && quality === 'acknowledge') {
        const res = yield that.io.ack(payload.jobid);
        context.emit('done', that.name, res);

      // get -----------------------------------------------
      } else if (type === 'queue' && quality === 'get') {
        if (!payload.queue) {
          that.logger.warn('No queue passed in the payload, using default queue %s', that.inputQueue);
        }
        const res = yield that.io.get(payload.queue || that.inputQueue);
        const json = res.result.json;
        if (json !== null) {
          if ( !(typeof json === 'object' && 'id' in json) ) {
            throw new Error('Missing id in consumed json');
          } else {
            that.cementHelper.createContext(json).publish();
          }
        }
        context.emit('done', that.name, json === null);

      // produce ------------------------------------------
      } else if (data) {
        const res = yield that.io.produce({
          queue: that.outputQueue,
          json: data,
        });
        context.emit('done', that.name, res);
        // that.logger.error('unknown data contract');
      }
    }).catch((err) => {
      that.logger.error(err);
      context.emit('reject', that.name, err);
      context.emit('error', that.name, err);
    });
  }
}

module.exports = Io;
