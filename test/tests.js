'use strict';

const Sqr = require('../lib/index.js');
const main = [{
  method: 'produce',
}, {
  method: 'consume',
}, {
  method: 'publish',
}, {
  method: 'subscribe',
}];

function Tests() {
  main.forEach(function mainFct(e) {
    it(e.method, function itFct(done) {
      const sqr = new Sqr(this.provider);
      sqr[e.method](this.id)
        .then(function thenFct(data) {
          console.log(data, '\n');
          done();
        }, function errFct(err) {
          done(err);
        });
    });
  });
}

module.exports = Tests;
