'use strict';

const messaging = require('cta-messaging')();
function cb(json) {
  console.log(json);
}
messaging.consume({
  queue: 'output.queue',
  cb: cb,
  ack: 'auto',
}).then(function(response) {
  console.log('response: ', response);
}, function(err) {
  throw new Error(err);
});
