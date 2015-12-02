'use strict';

const q = require('q');

function WKProvider() {

}

WKProvider.prototype = {

  produce: function produce(obj) {
    const deferred = q.defer();
    try {
      deferred.resolve(obj);
    } catch (err) {
      deferred.reject(err);
    }
    return deferred.promise;
  },

  consume: function consume(obj) {
    const deferred = q.defer();
    try {
      deferred.resolve(obj);
    } catch (err) {
      deferred.reject(err);
    }
    return deferred.promise;
  },

  publish: function publish(obj) {
    const deferred = q.defer();
    try {
      deferred.resolve(obj);
    } catch (err) {
      deferred.reject(err);
    }
    return deferred.promise;
  },

  subscribe: function subscribe(obj) {
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
