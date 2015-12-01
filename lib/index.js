module.exports = require('./sqr.js');
Object.defineProperty(module.exports, 'rabbitMQProvider', {
  get: function () {
    return require('./providers/rabbitmq.js');
  }
});
Object.defineProperty(module.exports, 'wampKueProvider', {
  get: function () {
    return require('./providers/wampkue.js');
  }
});