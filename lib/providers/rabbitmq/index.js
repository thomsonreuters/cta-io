'use strict';

const shortid = require('shortid');
const amqp = require('amqplib/callback_api');
const validate = require('../../validate/');

class RQProvider {
  /**
   * Create a new RQProvider instance
   * @param {object} params - object parameters
   * @param {string} params.url - rabbitMQ host
   */
  constructor(params) {
    const self = this;
    self.url = (typeof params === 'object' && 'url' in params) ? params.url : 'amqp://localhost?heartbeat=60';
    self.silo = {};
    self.clients = {};
    self.reconnecting = false;
    self.interval = null;
  }

  _consumeSiloMessages() {
    const self = this;
    const keys = Object.keys(self.silo);
    const L = keys.length;
    console.log(L + ' message(s) in silo, consuming...');
    if (L > 0) {
      for (let i = 0; i < L; i++) {
        const e = self.silo[keys[i]];
        self[e.method](e.params)
          .then((data) => {
            delete self.silo[data.params._uid];
          })
          .catch((err) => {
            console.error(err);
          });
      }
    }
  }

  _reconnectClients() {
    const self = this;
    const keys = Object.keys(self.clients);
    const L = keys.length;
    console.log(L + ' client(s) in silo, reconnecting...');
    if (L > 0) {
      for (let i = 0; i < L; i++) {
        const e = self.clients[keys[i]];
        self[e.method](e.params)
          .then((data) => {
            delete self.clients[data.params._uid];
          })
          .catch((err) => {
            console.error(err);
          });
      }
    }
  }

  _reconnect() {
    const self = this;
    if (self.reconnecting === true) {
      console.log('already reconnecting...');
      return;
    }
    self.reconnecting = true;
    self.interval = setInterval(function() {
      self._connect(true)
        .then(function() {
          clearInterval(self.interval);
          self.reconnecting = false;
          self._reconnectClients();
          self._consumeSiloMessages();
          // console.log('interval = ', self.interval);
        });
    }, 2000);
  }

  _connect(force) {
    const self = this;
    return new Promise((resolve, reject) => {
      if (force !== true && self.connection && self.channel) {
        return resolve();
      }
      console.log('*** Connecting to rabbitMQ...');
      amqp.connect(self.url, function(connErr, connection) {
        if (connErr) {
          console.log('*** rabbitMQ connection error');
          self._reconnect();
          reject(connErr);
        } else {
          connection.on('close', function() {
            console.log('*** connection close event');
            self._reconnect();
          });
          connection.on('error', function(err) {
            console.log('*** connection error event: ', err);
          });
          self.connection = connection;
          connection.createChannel(function(chErr, channel) {
            if (chErr) {
              reject(chErr);
            } else {
              channel.on('close', function() {
                console.log('*** channel close event');
              });
              channel.on('error', function(err) {
                console.log('*** channel error event: ', err);
              });
              self.channel = channel;
              resolve();
            }
          });
        }
      });
    });
  }

  /**
   * Execute a callback function after parameters validation
   * @param {object} params - object parameters
   * @param {object} pattern - validation pattern for params
   * @param {function} cb - callback function that accepts 2 params: ch (rabbitMQ channel) & conn (rabbitMQ connection)
   * @return {object} - promise
   */
  _exec(params, pattern, cb) {
    const self = this;
    params.extra = validate(params.extra, pattern);
    return new Promise((resolve, reject) => {
      self._connect()
        .then(function() {
          return cb(params);
        })
        .then(function(result) {
          resolve({params: params, result: result});
        })
        .catch(function(err) {
          reject(err);
        });
    });
  }

  /**
   * Convert buffer to json
   * @param {buffer} buffer - the buffer to convert
   * @return {object} - the converted buffer as json
   */
  _bufferToJSON(buffer) {
    return JSON.parse(buffer.toString());
  }

  /**
   * Convert json to buffer
   * @param {object} - the json to convert
   * @return {object} buffer - the converted json as buffer
   */
  _jsonToBuffer(json) {
    return new Buffer(JSON.stringify(json));
  }

  /**
   * Produce a message in a queue
   * @param {object} params - object parameters
   * @param {string} params.queue - the queue name where to produce the message
   * @param {object} params.json - the message to produce as json
   * @param {object} params.extra - rabbitMQ extra parameters
   * @param {boolean} params.extra.mq_persistent - rabbitMQ durable parameter
   * @param {boolean} params.extra.mq_durable - rabbitMQ persistent parameter
   * @return {object} - promise
   */
  produce(params) {
    const self = this;

    const pattern = {
      mq_persistent: {
        optional: true,
        type: 'boolean',
        defaultTo: true,
      },
      mq_durable: {
        optional: true,
        type: 'boolean',
        defaultTo: true,
      },
    };

    function cb(input) {
      return new Promise((resolve, reject) => {
        try {
          self.channel.assertQueue(input.queue, {durable: input.extra.mq_durable});
          self.channel.sendToQueue(input.queue, self._jsonToBuffer(input.json), {persistent: input.extra.mq_persistent});
          console.log('RabbitMQProvider => Produced new message: ', input.json);
          resolve();
        } catch (e) {
          reject('RabbitMQProvider => ', e);
        }
      });
    }

    return self._exec(params, pattern, cb)
      .catch(function() {
        // console.error(err);
        console.log('*** to silo');
        const uid = shortid.generate();
        params._uid = uid;
        self.silo[uid] = {
          method: 'produce',
          params: params,
        };
      });
  }

  /**
   * Consume a message from a queue
   * @param {object} params - object parameters
   * @param {string} params.queue - the queue name where to produce the message
   * @param {function} params.cb - callback function to run after consuming a message
   * @param {object} params.extra - rabbitMQ extra parameters
   * @param {boolean} params.extra.mq_noAck - rabbitMQ noAck parameter
   * @param {boolean} params.extra.mq_prefetch - rabbitMQ prefetch parameter
   * @param {boolean} params.extra.mq_durable - rabbitMQ durable parameter
   * @return {object} - promise
   */
  consume(params) {
    const self = this;

    const pattern = {
      mq_noAck: {
        optional: true,
        type: 'boolean',
        defaultTo: false,
      },
      mq_prefetch: {
        optional: true,
        type: 'number',
        defaultTo: 1,
      },
      mq_durable: {
        optional: true,
        type: 'boolean',
        defaultTo: true,
      },
    };

    function cb(input) {
      return new Promise((resolve, reject) => {
        self.channel.assertQueue(input.queue, {durable: input.extra.mq_durable});
        self.channel.prefetch(input.extra.mq_prefetch);
        console.log('RabbitMQProvider => Waiting for messages in queue "%s"', input.queue);
        self.channel.consume(input.queue, function(msg) {
          const json = self._bufferToJSON(msg.content);
          input.cb(json)
            .then(function(data) {
              self.channel.ack(msg);
              resolve(data);
            }, function(err) {
              reject(err);
            });
        }, {noAck: input.extra.mq_noAck});
      });
    }

    return self._exec(params, pattern, cb)
      .then(function() {
        params._uid = shortid.generate();
        self.clients[params._uid] = {
          method: 'consume',
          params: params,
        };
      });
  }

  /**
   * Publish a message to a chanel
   * @param {object} params - object parameters
   * @param {string} params.key - the chanel key name where to publish the message
   * @param {object} params.json - the message to publish in json format
   * @param {object} params.extra - rabbitMQ extra parameters
   * @param {boolean} params.extra.mq_ex_name - rabbitMQ exchange name
   * @param {boolean} params.extra.mq_ex_type - rabbitMQ exchange type
   * @param {boolean} params.extra.mq_durable - rabbitMQ durable parameter
   * @return {object} - promise
   */
  publish(params) {
    const self = this;

    const pattern = {
      mq_ex_name: {
        optional: true,
        type: 'string',
        defaultTo: 'default',
      },
      mq_ex_type: {
        optional: true,
        type: 'string',
        defaultTo: 'topic',
      },
      mq_durable: {
        optional: true,
        type: 'boolean',
        defaultTo: true,
      },
    };

    function cb(input) {
      return new Promise((resolve, reject) => {
        try {
          self.channel.assertExchange(input.extra.mq_ex_name, input.extra.mq_ex_type, {durable: input.extra.mq_durable});
          self.channel.publish(input.extra.mq_ex_name, input.key, self._jsonToBuffer(input.json));
          console.log('RabbitMQProvider => Published new message: ', input.json);
          resolve();
        } catch (e) {
          reject(e);
        }
      });
    }

    return self._exec(params, pattern, cb)
      .catch(function() {
        // console.error(err);
        console.log('*** to silo');
        const uid = shortid.generate();
        params._uid = uid;
        self.silo[uid] = {
          method: 'publish',
          params: params,
        };
      });
  }

  /**
   * Subscribe to messages from a chanel
   * @param {object} params - object parameters
   * @param {string} params.key - the chanel key name where to listen to messages
   * @param {function} params.cb - callback function to run after receiving a message, it takes the received json msg as a param
   * @param {object} params.extra - rabbitMQ extra parameters
   * @param {boolean} params.extra.mq_ex_name - rabbitMQ exchange name
   * @param {boolean} params.extra.mq_ex_type - rabbitMQ exchange type
   * @param {boolean} params.extra.mq_durable - rabbitMQ durable parameter
   * @return {object} - promise
   */
  subscribe(params) {
    const self = this;

    const pattern = {
      mq_ex_name: {
        optional: true,
        type: 'string',
        defaultTo: 'default',
      },
      mq_ex_type: {
        optional: true,
        type: 'string',
        defaultTo: 'topic',
      },
      mq_durable: {
        optional: true,
        type: 'boolean',
        defaultTo: true,
      },
      mq_noAck: {
        optional: true,
        type: 'boolean',
        defaultTo: false,
      },
    };

    function cb(input) {
      return new Promise((resolve, reject) => {
        self.channel.assertExchange(input.extra.mq_ex_name, input.extra.mq_ex_type, {durable: input.extra.mq_durable});
        self.channel.assertQueue(input.key, {exclusive: false}, function(assertErr, queue) {
          if (assertErr) {
            return reject(assertErr);
          }
          console.log('RabbitMQProvider => Subscribed, waiting for messages...');
          self.channel.bindQueue(queue.queue, input.extra.mq_ex_name, input.key);
          self.channel.consume(queue.queue, function(msg) {
            const json = self._bufferToJSON(msg.content);
            console.log('RabbitMQProvider => Consuming new message: ', json);
            const res = input.cb(json);
            if (res instanceof Promise) {
              console.log('Promise callback');
              res.then(function(data) {
                self.channel.ack(msg);
                resolve(data);
              }, function(err) {
                reject(err);
              });
            } else {
              console.log('Standard callback');
              self.channel.ack(msg);
              resolve();
            }
          }, {noAck: input.extra.mq_noAck});
          resolve();
        });
      });
    }

    return self._exec(params, pattern, cb)
    .then(function() {
      params._uid = shortid.generate();
      self.clients[params._uid] = {
        method: 'subscribe',
        params: params,
      };
    });
  }

}

exports = module.exports = RQProvider;
