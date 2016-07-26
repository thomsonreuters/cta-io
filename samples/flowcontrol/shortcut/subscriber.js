'use strict';

const messaging = require('cta-messaging')();
function cb(json) {
  return new Promise((resolve) => {
    resolve(json);
  });
}
messaging.subscribe({
  queue: 'output.queue',
  cb: cb,
}).then(function(response) {
  console.log('response: ', response);
}, function(err) {
  throw new Error(err);
});
