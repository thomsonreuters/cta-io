'use strict';

const q = require('q');

class WKProvider {

  constructor(params) {
    this.uri = params.uri;
  }

  produce(obj) {
    const deferred = q.defer();
    try {
      deferred.resolve(obj);
    } catch (err) {
      deferred.reject(err);
    }
    return deferred.promise;
  }

  consume(obj) {
    const deferred = q.defer();
    try {
      deferred.resolve(obj);
    } catch (err) {
      deferred.reject(err);
    }
    return deferred.promise;
  }

  publish(obj) {
    const deferred = q.defer();
    try {
      deferred.resolve(obj);
    } catch (err) {
      deferred.reject(err);
    }
    return deferred.promise;
  }

  subscribe(obj) {
    const deferred = q.defer();
    try {
      deferred.resolve(obj);
    } catch (err) {
      deferred.reject(err);
    }
    return deferred.promise;
  }

}

exports = module.exports = WKProvider;
