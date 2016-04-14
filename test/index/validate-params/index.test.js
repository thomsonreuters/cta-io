'use strict';

const o = require('../../common');
const validations = require('./_validations');

describe('index -> validate params', function() {
  Object.keys(o.providers).forEach(function(provider) {
    context(provider + ' common params validations', function () {
      Object.keys(validations).forEach(function (method) {
        const tests = validations[method];
        tests.forEach(function (test) {
          it(test.message, function (done) {
            const io = new o.Io(provider);
            io[method](test.params)
              .then(function (data) {
                console.log('data: ', data);
                done('error');
              }, function (err) {
                console.error('err: ', err);
                done();
              });
          });
        });
      });
    });
  });
});
