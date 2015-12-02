'use strict';

const q = require('q');

function WKProvider() {

}

WKProvider.prototype = {

  produce: function(obj) {
    const deferred = q.defer();
    try {
      deferred.resolve(obj);
    } catch (err) {
      deferred.reject(err);
    }
    return deferred.promise;
  },

  consume: function(obj) {
    const deferred = q.defer();
    try {
      deferred.resolve(obj);
    } catch (err) {
      deferred.reject(err);
    }
    return deferred.promise;
  },

  publish: function(obj) {
    const deferred = q.defer();
    try {
      deferred.resolve(obj);
    } catch (err) {
      deferred.reject(err);
    }
    return deferred.promise;
  },

  subscribe: function(obj) {
    const deferred = q.defer();
    try {
      deferred.resolve(obj);
    } catch (err) {
      deferred.reject(err);
    }
    return deferred.promise;
  },

};

exports = module.exports = WKProvider;
