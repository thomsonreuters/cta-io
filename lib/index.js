'use strict';

const co = require('co');
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
        const res = yield that._get(payload.queue);
        context.emit('done', that.name, res);

      // subscribe
      } else if (type === 'message' && quality === 'subscribe') {
        const res = yield that._subscribe(payload.topic);
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
   * subscribe to an exchange
   * @param topic - exchange key
   * @returns {Promise}
   * @private
   */
  _subscribe(topic) {
    const that = this;
    return new Promise((resolve, reject) => {
      that.messaging.subscribe({
        topic: topic,
        cb: (message) => {
          if (message !== null) {
            if (!(typeof message === 'object' && 'id' in message)) {
              reject('Missing id in consumed message');
            } else {
              that.cementHelper.createContext(message).publish();
            }
          }
        },
      })
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
   * @param queue - queue name
   * @returns {Promise}
   * @private
   */
  _consume(payload) {
    const that = this;
    return new Promise((resolve, reject) => {
      if (!payload.queue) {
        reject('No queue passed in the payload');
      }
      that.messaging.consume({
        queue: payload.queue,
        prefetch: typeof payload.prefetch === 'number' ? payload.prefetch : 1,
        cb: (message) => {
          if (message !== null) {
            if (!(typeof message === 'object' && 'id' in message)) {
              reject('Missing id in consumed message');
            } else {
              that.cementHelper.createContext(message).publish();
            }
          }
        },
      })
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
      that.messaging.get({queue: queue || that.inputQueue})
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
   * @returns {Promise}
   * @private
   */
  _publish(data) {
    const that = this;
    return new Promise((resolve, reject) => {
      let topic;
      let message;
      if ('topic' in data.payload && 'message' in data.payload && Object.keys(data.payload).length === 2) {
        topic = data.payload.topic;
        message = data.payload.message;
      } else {
        topic = that.output.topic;
        message = data.payload;
      }
      that.messaging.publish({
        topic: topic,
        json: message,
      }).then((response) => {
        resolve(response);
      }).catch((err) => {
        // that.logger.error('produce error: ', err);
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
      let queue;
      let message;
      if ('queue' in data.payload && 'message' in data.payload && Object.keys(data.payload).length === 2) {
        queue = data.payload.queue;
        message = data.payload.message;
      } else {
        queue = that.output.queue;
        message = data.payload;
      }
      that.messaging.produce({
        queue: queue,
        json: message,
      }).then((response) => {
        resolve(response);
      }).catch((err) => {
        // that.logger.error('produce error: ', err);
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
        quality: 'save',
      },
      payload: json,
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
        quality: 'read',
      },
      payload: {},
    };
    that.cementHelper.createContext(data).publish();
  }
}

module.exports = IoBrick;
