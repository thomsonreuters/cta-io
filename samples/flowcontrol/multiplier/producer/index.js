'use strict';

const shortid = require('shortid');
const messaging = require('cta-messaging')();

function generate() {
  return Math.ceil(10 * Math.random());
}

const fn = () => {
  messaging.produce({
    queue: 'input.queue',
    content: {
      id: shortid.generate(),
      nature: {
        type: 'multiplication',
        quality: 'do',
      },
      payload: {
        x: generate(),
        y: generate(),
      },
    },
  }).then(function(response) {
    console.log('response: ', response);
  }, function(err) {
    throw new Error(err);
  });
};

setInterval(fn, 5000);
