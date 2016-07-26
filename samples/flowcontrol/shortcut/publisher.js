'use strict';

const messaging = require('cta-messaging')();
const json = {
  data: 'Time is ' + new Date(),
};

const fn = () => {
  messaging.publish({
    queue: 'input.queue',
    json: json,
  }).then(function(response) {
    console.log('response: ', response);
  }, function(err) {
    throw new Error(err);
  });
};

setInterval(fn, 1000);
