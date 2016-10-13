'use strict';

const co = require('co');
const _ = require('lodash');
const Brick = require('cta-brick');
const Messaging = require('cta-messaging');

class IoBrick extends Brick {
  /**
   * Create a new Io instance
   * @param {CementHelper} cementHelper - cementHelper instance
   * @param {BrickConfig} config - cement configuration of the brick
   */
  constructor(cementHelper, config) {
    super(cementHelper, config);
    const that = this;
    this.input = {
      queue: null,
      topic: null,
    };
    if (this.properties.input && typeof this.properties.input === 'object') {
      if (this.properties.input.queue) {
        this.input.queue = this.properties.input.queue;
      }
      if (this.properties.input.topic) {
        this.input.topic = this.properties.input.topic;
      }
    }
    this.output = {
      queue: null,
      topic: null,
    };
    if (this.properties.output && typeof this.properties.output === 'object' && this.properties.output.queue) {
      if (this.properties.output.queue) {
        this.output.queue = this.properties.output.queue;
      }
      if (this.properties.output.topic) {
        this.output.topic = this.properties.output.topic;
      }
    }
    if (this.dependencies.messaging) {
      that.messaging = this.dependencies.messaging;
    } else {
      that.messaging = new Messaging();
    }
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
    return new Promise((resolve, reject) => {
      const queues = Array.isArray(that.input.queue) ? that.input.queue : [that.input.queue];
      const topics = Array.isArray(that.input.topic) ? that.input.topic : [that.input.topic];
      const cb = (json) => {
        that.cementHelper.createContext(json).publish();
      };
      const promises = [];
      queues.forEach((queue) => {
        if (queue) {
          promises.push(that.messaging.consume({
            queue: queue,
            cb: cb,
          }));
        }
      });
      topics.forEach((topic) => {
        if (topic) {
          promises.push(that.messaging.subscribe({
            topic: topic,
            cb: cb,
          }));
        }
      });
      if (promises.length) {
        Promise.all(promises)
          .then((data) => {
            return resolve(data);
          }).catch((err) => {
            return reject(err);
          });
      } else {
        that.logger.warn('Missing input properties');
        return resolve();
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
      let payload = {};

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
      if (type === 'message' && quality === 'acknowledge') {
        const res = yield that._ack(payload.id);
        context.emit('done', that.name, res);

      // get
      } else if (type === 'message' && quality === 'get') {
        const res = yield that._get(payload);
        context.emit('done', that.name, res);

      // subscribe
      } else if (type === 'message' && quality === 'subscribe') {
        const res = yield that._subscribe(payload);
        context.emit('done', that.name, res);

      // consume
      } else if (type === 'message' && quality === 'consume') {
        const res = yield that._consume(payload);
        context.emit('done', that.name, res);

      // publish
      } else if (type === 'message' && quality === 'publish') {
        const res = yield that._publish(data);
        context.emit('done', that.name, res);

      // produce
      } else if (type === 'message' && quality === 'produce') {
        const res = yield that._produce(data);
        context.emit('done', that.name, res);
      }
    }).catch((err) => {
      // that.logger.error(err);
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
    return this.messaging.ack(id);
  }

  /**
   * subscribe to a topic on an exchange
   * @param payload - cta-messaging subscribe method object parameter
   * @returns {Promise}
   * @private
   */
  _subscribe(payload) {
    const that = this;
    return new Promise((resolve, reject) => {
      const _payload = _.cloneDeep(payload);
      if (!('cb' in _payload)) {
        _payload.cb = (message) => {
          if (message !== null) {
            if (!(typeof message === 'object' && 'id' in message)) {
              reject('Missing id in consumed message');
            } else {
              that.cementHelper.createContext(message).publish();
            }
          }
        };
      }
      that.messaging.subscribe(_payload)
        .then((data) => {
          resolve(data);
        })
        .catch((err) => {
          reject(err);
        });
    });
  }

  /**
   * consume messages from a queue
   * @param payload - cta-messaging consume method object parameter
   * @returns {Promise}
   * @private
   */
  _consume(payload) {
    const that = this;
    return new Promise((resolve, reject) => {
      const _payload = _.cloneDeep(payload);
      if (!('cb' in _payload)) {
        _payload.cb = (message) => {
          if (message !== null) {
            if (!(typeof message === 'object' && 'id' in message)) {
              reject('Missing id in consumed message');
            } else {
              that.cementHelper.createContext(message).publish();
            }
          }
        };
      }
      that.messaging.consume(_payload)
        .then((data) => {
          resolve(data);
        })
        .catch((err) => {
          reject(err);
        });
    });
  }

  /**
   * get one message from queue
   * @param payload - cta-messaging get method object parameter
   * @returns {Promise}
   * @private
   */
  _get(payload) {
    const that = this;
    const _payload = _.cloneDeep(payload);
    if (!('queue' in _payload)) {
      that.logger.warn('No queue passed in the payload, using default queue %s', that.inputQueue);
      _payload.queue = that.inputQueue;
    }
    return new Promise((resolve, reject) => {
      that.messaging.get(_payload)
        .then((data) => {
          const json = data.result.json;
          if (json !== null) {
            if (!(typeof json === 'object' && 'id' in json)) {
              reject('Missing id in consumed message');
            } else {
              that.cementHelper.createContext(json).publish();
            }
          }
          resolve(json === null);
        })
        .catch((err) => {
          reject(err);
        });
    });
  }

  /**
   * publish one message in an exchange
   * @param data - data channel contracts & payload
   * @param data.payload - cta-messaging publish method object parameter or message to produce in default output topic
   * @returns {Promise}
   * @private
   */
  _publish(data) {
    const that = this;
    return new Promise((resolve, reject) => {
      let _payload;
      if ('topic' in data.payload && 'message' in data.payload) {
        _payload = _.cloneDeep(data.payload);
        _payload.json = data.payload.message;
        delete _payload.message;
      } else {
        _payload = {
          topic: that.output.topic,
          json: data.payload,
        };
      }
      that.messaging.publish(_payload)
        .then((response) => {
          resolve(response);
        })
        .catch((err) => {
          that.storeMode = true;
          if (that.interval === null) {
            that.interval = setInterval(() => {
              if (that.messaging.healthCheck() === true) {
                clearInterval(that.interval);
                that.interval = null;
                that.storeMode = false;
                that._retrieve();
              }
            }, 1000);
          }
          that._store(data);
          reject(err);
        });
    });
  }

  /**
   * produce one message in a queue
   * @param data - data channel contracts & payload
   * @returns {Promise}
   * @private
   */
  _produce(data) {
    const that = this;
    return new Promise((resolve, reject) => {
      let _payload;
      if ('queue' in data.payload && 'message' in data.payload) {
        _payload = _.cloneDeep(data.payload);
        _payload.json = data.payload.message;
        delete _payload.message;
      } else {
        _payload = {
          queue: that.output.queue,
          json: data.payload,
        };
      }
      that.messaging.produce(_payload)
        .then((response) => {
          resolve(response);
        })
        .catch((err) => {
          that.storeMode = true;
          if (that.interval === null) {
            that.interval = setInterval(() => {
              if (that.messaging.healthCheck() === true) {
                clearInterval(that.interval);
                that.interval = null;
                that.storeMode = false;
                that._retrieve();
              }
            }, 1000);
          }
          that._store(data);
          reject(err);
        });
    });
  }

  /**
   * backup non produced/published message
   * @param json - message to store
   * @private
   */
  _store(json) {
    const that = this;
    const data = {
      nature: {
        type: 'document',
        quality: 'backup',
      },
      payload: {
        doc: json,
      },
    };
    that.cementHelper.createContext(data).publish();
  }

  /**
   * restore non produced/published message
   * @private
   */
  _retrieve() {
    const that = this;
    const data = {
      nature: {
        type: 'document',
        quality: 'restore',
      },
      payload: {
        query: {},
        clear: true,
        cb: function(response) {
          that.logger.info('restored documents', response);
          response.docs.forEach((doc) => {
            that[doc.method](doc.params)
            .then((result) => {
              that.logger.debug(result);
            }).catch((err) => {
              that.logger.error(err);
            });
          });
        },
      },
    };
    that.cementHelper.createContext(data).publish();
  }
}

module.exports = IoBrick;
