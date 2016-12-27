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
      const cb = (content) => {
        that.cementHelper.createContext(content).publish();
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
   * Process the context
   * @param {Context} context - a Context
   */
  process(context) {
    const that = this;
    return new Promise((resolve, reject) => {
      co(function* processCoroutine() {

        if (context.data.nature.type !== 'messages') {
          const error = `Incorrect type '${context.data.nature.type}' should be 'messages'`;
          context.emit('reject', that.name, error);
          reject(error);
          return;
        }

        let response;

        switch (context.data.nature.quality) {
          case 'acknowledge':
            response = yield that._ack(context.data.payload.id);
            break;

          case 'get':
            response = yield that._get(context.data.payload);
            break;

          case 'subscribe':
            response = yield that._subscribe(context.data.payload);
            break;

          case 'consume':
            response = yield that._consume(context.data.payload);
            break;

          case 'publish':
            response = yield that._publish(context.data);
            break;

          case 'produce':
            response = yield that._produce(context.data);
            break;

          default:
            const error = `Incorrect quality '${context.data.nature.quality}' should be one of 'acknowledge, get, subscribe, consume, publish, produce'`;
            context.emit('reject', that.name, error);
            reject(error);
            return;

        }
        context.emit('done', that.name, response);
        resolve(response);
      })
      .catch((err) => {
        reject(err);
        context.emit('reject', that.name, err);
        context.emit('error', that.name, err);
      });
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
          const content = data.result.content;
          if (content !== null) {
            if (!(typeof content === 'object' && 'id' in content)) {
              reject('Missing id in consumed message');
            } else {
              that.cementHelper.createContext(content).publish();
            }
          }
          resolve(content === null);
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
      if ('topic' in data.payload && 'content' in data.payload) {
        _payload = _.cloneDeep(data.payload);
      } else {
        _payload = {
          topic: that.output.topic,
          content: data.payload,
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
          that._store({method: '_publish', params: data});
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
      if ('queue' in data.payload && 'content' in data.payload) {
        _payload = _.cloneDeep(data.payload);
      } else {
        _payload = {
          queue: that.output.queue,
          content: data.payload,
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
          that._store({method: '_produce', params: data});
          reject(err);
        });
    });
  }

  /**
   * backup non produced/published message
   * @param content - message to store
   * @private
   */
  _store(content) {
    const that = this;
    const data = {
      nature: {
        type: 'documents',
        quality: 'backup',
      },
      payload: {
        doc: content,
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
        type: 'documents',
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
