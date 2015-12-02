module.exports = require('./sqr.js');

Object.defineProperty(module.exports, 'rabbitMQProvider', {
  get: function get() {
    return require('./providers/rabbitmq.js');
  },
});

Object.defineProperty(module.exports, 'wampKueProvider', {
  get: function get() {
    return require('./providers/wampkue.js');
  },
});
