'use strict';

const co = require('co');
const Brick = require('cta-brick');
const io = require('./io');

class IoBrick extends Brick {
  /**
   * Create a new Io instance
   * @param {CementHelper} cementHelper - cementHelper instance
   * @param {BrickConfig} config - cement configuration of the brick
   */
  constructor(cementHelper, config) {
    super(cementHelper, config);
    const that = this;
    const providerName = that.properties.providerName || 'rabbitmq';
    const parameters = that.properties.parameters || {};
    that.inputQueue = parameters.inputQueue || null;
    that.inputMethod = parameters.inputMethod || 'subscribe';
    that.outputQueue = parameters.outputQueue || 'output_queue';
    that.outputMethod = parameters.outputMethod || 'produce';
    that.io = io(providerName, parameters, that.logger);
    that.storeMode = false;
    that.interval = null;
  }

  /**
   * This method is called by Cement when all other Bricks are initialized and ready
   * It listens to an outside queue for messages to consume from
   * Then it publishes what has been consumed to the internal channel
   * */
  start() {
    super.start();
    const that = this;
    if (that.inputQueue !== null) {
      return new Promise((resolve, reject) => {
        const method = that.inputMethod;
        const params = {
          queue: that.inputQueue,
          cb: function(json) {
            that.cementHelper.createContext(json).publish();
          },
        };
        that.io[method](params)
          .then((data) => {
            that.logger.debug(data);
            return resolve(data);
          }, (err) => {
            that.logger.error(err);
            return reject(err);
          });
      });
    }
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

      // ack
      if (type === 'execution' && quality === 'acknowledge') {
        const res = yield that._ack(payload.jobid);
        context.emit('done', that.name, res);

      // get
      } else if (type === 'queue' && quality === 'get') {
        const res = yield that._get(payload.queue);
        context.emit('done', that.name, res);

      // produce
      } else if (data) {
        const res = yield that._produce(data);
        context.emit('done', that.name, res);
      }
    }).catch((err) => {
      that.logger.error(err);
      context.emit('reject', that.name, err);
      context.emit('error', that.name, err);
    });
  }

  /**
   * ack a message
   * @param id - message id
   * @returns {*}
   * @private
   */
  _ack(id) {
    return this.io.ack(id);
  }

  /**
   * get one message from queue
   * @param queue - queue name
   * @returns {Promise}
   * @private
   */
  _get(queue) {
    const that = this;
    if (!queue) {
      that.logger.warn('No queue passed in the payload, using default queue %s', that.inputQueue);
    }
    return new Promise((resolve, reject) => {
      that.io.get(queue || that.inputQueue)
        .then(function(data) {
          const json = data.result.json;
          if (json !== null) {
            if (!(typeof json === 'object' && 'id' in json)) {
              reject('Missing id in consumed json');
            } else {
              that.cementHelper.createContext(json).publish();
            }
          }
          resolve(json === null);
        })
        .catch(function(err) {
          reject(err);
        });
    });
  }

  /**
   * produce one message in default output queue
   * @param json - message to produce
   * @returns {Promise}
   * @private
   */
  _produce(json) {
    const that = this;
    return new Promise((resolve, reject) => {
      that.io.produce({
        queue: that.outputQueue,
        json: json,
      }).then(function(response) {
        that.logger.info('produce response: ', response);
        resolve(response);
      }, function(err) {
        that.logger.error('produce error: ', err);
        that.storeMode = true;
        if (that.interval === null) {
          that.interval = setInterval(function() {
            if (that.io.healthCheck() === true) {
              clearInterval(that.interval);
              that.interval = null;
              that.storeMode = false;
              that._retrieve();
            }
          }, 1000);
        }
        that._store(json);
        resolve(err);
      });
    });
  }

  /**
   * ask channel to store message in silo
   * @param json - message to store
   * @private
   */
  _store(json) {
    const that = this;
    const data = {
      nature: {
        type: 'teststatus',
        quality: 'save',
      },
      payload: json,
    };
    that.cementHelper.createContext(data).publish();
  }

  /**
   * ask channel to recover messages from silo
   * @private
   */
  _retrieve() {
    const that = this;
    const data = {
      nature: {
        type: 'teststatus',
        quality: 'read',
      },
      payload: {},
    };
    that.cementHelper.createContext(data).publish();
  }
}

module.exports = IoBrick;
