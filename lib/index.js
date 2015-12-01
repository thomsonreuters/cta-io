module.exports = require('./sqr.js');
module.exports.__defineGetter__('rabbitMQProvider', function(){
  return require('./providers/rabbitmq.js');
});
module.exports.__defineGetter__('wampKueProvider', function(){
  return require('./providers/wampkue.js');
});