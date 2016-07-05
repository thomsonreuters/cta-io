'use strict';

const main = require('./main');

/**
 * RabbitMQProvider class
 * @class
 */
class RabbitMQProvider {
  /**
   * Create a new RabbitMQProvider instance
   * @param {object} config - RabbitMQ configuration (see ./index)
   * @param {object} logger - logger instance
   */
  constructor(config, logger) {
    this.logger = logger;
    this.config = config;
    this.reconnecting = false;
    this.connection = null;
    this.channel = null;
    this.consumers = {};
    this.messages = {};
    this.acked = {};
    this._houseKeeping();
  }

  /**
   * Convert a buffer to a json
   * @param {buffer} buffer - the buffer to convert
   * @private
   */
  _bufferToJSON(buffer) {
    return JSON.parse(buffer.toString());
  }

  /**
   * @param {object} json - the json to convert
   * @returns {Buffer} - the converted json as buffer
   * @private
   */
  _jsonToBuffer(json) {
    return new Buffer(JSON.stringify(json));
  }

  /**
   * Process a consumed message:
   * - transform the msg buffer into json
   * - generate an id if necessary
   * - save the message for future acknowledgement if necessary
   * @param {object} msg - consumed message
   * @param {boolean} save - weather to save the message for future acknowledgement
   * @returns {object}
   * @private
   */
  _processMsg(msg, save) {
    return main._processMsg(msg, save, this);
  }

  /**
   * Housekeeping: remove old messages from memory that have not been acknowledged
   * @private
   */
  _houseKeeping() {
    main._houseKeeping(this);
  }

  /**
   * Reconnect consumers after RabbitMQ is reconnected
   * @private
   */
  _reconnectConsumers() {
    main._reconnectConsumers(this);
  }

  /**
   * Connect RabbitMQ & set connection & channel properties
   * @param {Boolean} force - weather to force connection or return existing connection
   * @returns {Promise}
   */
  _connect(force) {
    const _force = (force === true);
    return main._connect(_force, this);
  }

  /**
   * Create RabbitMQ channel
   * @param {Boolean} force - weather to force channel creation or return existing channel
   * @return {object} - promise
   */
  _channel(force) {
    const _force = (force === true);
    return main._channel(_force, this);
  }

  /**
   * Init RabbitMQ connection & channel
   * @return {object} - promise
   */
  _init() {
    return main._init(this);
  }

  /**
   * RabbitMQ health check
   * @returns {boolean} - true if connected, false if not
   */
  healthCheck() {
    return this.connection ? true : false;
  }

  /**
   * Produce a message in a queue
   * @param {object} params - object of parameters
   * @param {string} params.queue - the queue name where to produce the message
   * @param {object} params.json - the message to produce as json
   * @return {object} - promise
   */
  produce(params) {
    const vp = main.produce(params, this);
    return main._exec(vp, this);
  }

  /**
   * Get a message from a queue
   * @param {object} params - object parameters
   * @param {string} params.queue - the queue name where to get the message
   * @param {string} params.ack - ack mode
   * if 'auto': ack as soon as the message is consumed
   * else you should ack manually by calling provider's ack method
   * @return {object} - promise
   */
  get(params) {
    const vp = main.get(params, this);
    return main._exec(vp, this);
  }

  /**
   * Consume a message from a queue
   * @param {object} params - object parameters
   * @param {string} params.queue - the queue name where to produce the message
   * @param {function} params.cb - callback function to run after consuming a message
   * @param {string} params.ack - ack mode
   * if 'auto': ack as soon as the message is consumed
   * if 'resolve': ack as soon as the callback is resolved
   * else you should ack manually by calling provider's ack method
   * @return {object} - promise
   */
  consume(params) {
    const vp = main.consume(params, this);
    return main._exec(vp, this);
  }

  /**
   * Publish a message to a chanel
   * @param {object} params - object parameters
   * @param {string} params.queue - the chanel key name where to publish the message
   * @param {object} params.json - the message to publish in json format
   * @return {object} - promise
   */
  publish(params) {
    const vp = main.publish(params, this);
    return main._exec(vp, this);
  }

  /**
   * Subscribe to messages from a chanel
   * @param {object} params - object parameters
   * @param {string} params.queue - the chanel key name where to listen to messages
   * @param {function} params.cb - callback function to run after receiving a message, it takes the received json msg as a param
   * @param {string} params.ack - ack mode:
   * - if 'auto': ack as soon as the message is consumed
   * - if 'resolve': ack as soon as the callback is resolved
   * - else you should ack manually by calling provider's ack method
   * @return {object} - promise
   */
  subscribe(params) {
    const vp = main.subscribe(params, this);
    return main._exec(vp, this);
  }

  /**
   * Acknowledge a message in a queue, remove it from the queue
   * @param {string} ackId - id of the message to acknowledge
   * @returns {Promise}
   */
  ack(ackId) {
    const vp = main.ack(ackId, this);
    return main._exec(vp, this);
  }

  /**
   * Not acknowledge a message in a queue
   * @param {string} params - object of parameters
   * @param {string} params.id - id of the message to acknowledge
   * @param {boolean} params.requeue - RabbitMQ option, weather to requeue the msg or not
   * @returns {Promise}
   */
  nack(params) {
    const vp = main.nack(params, this);
    return main._exec(vp, this);
  }

  /**
   * Get information about a queue
   * @param {string} queue - queue name
   * @return {object} - promise
   */
  info(queue) {
    const vp = main.info(queue, this);
    return main._exec(vp, this);
  }

  /**
   * Cancel a consumer
   * @param {string} consumerTag - consumerTag
   * @return {object} - promise
   */
  cancel(consumerTag) {
    const vp = main.cancel(consumerTag, this);
    return main._exec(vp, this);
  }

}

exports = module.exports = RabbitMQProvider;
