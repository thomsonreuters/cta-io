'use strict';

const o = require('../common');
const validations = require('./index.validate.testdata.js');

describe('functional: index / validate params', function() {
  Object.keys(o.providers).forEach(function(provider) {
    context(provider + ' common params validations', function() {
      Object.keys(validations).forEach(function(method) {
        const tests = validations[method];
        tests.forEach(function(test) {
          it(test.message, function(done) {
            const io = new o.Io(provider);
            io[method](test.params)
              .then(function(data) {
                console.log('data: ', data);
                done('should be rejected!');
              }, function(err) {
                console.error('successful expected error: ', err);
                done();
              });
          });
        });
      });
    });
  });
});

