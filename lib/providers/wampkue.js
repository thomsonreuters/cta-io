'use strict';

const q = require('q');
const autobahn = require('autobahn');

class WKProvider {

  constructor(params) {
    this.url = params.url;
    this.realm = params.realm;
  }

  init(cb) {
    const self = this;
    const deferred = q.defer();
    const connection = new autobahn.Connection({
      url: self.url,
      realm: self.realm,
    });
    connection.onopen = function(session) {
      cb(session)
        .then(function(data) {
          deferred.resolve(data);
        }, function(err) {
          deferred.reject(err);
        });
    };
    connection.open();
    return deferred.promise;
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

  publish(params) {
    return this.init(function(session) {
      const deferred = q.defer();
      session.publish(params.key, [params.json]);
      deferred.resolve();
      return deferred.promise;
    });
  }

  subscribe(params) {
    return this.init(function(session) {
      const deferred = q.defer();
      session.subscribe(params.key, function(data) {
        params.cb(data);
      }).then(function() {
        console.log('Subscribed to ' + params.key);
        deferred.resolve();
      }, function(err) {
        console.error('Failed to subscribe to ' + params.key, err);
        deferred.reject(err);
      });
      return deferred.promise;
    });
  }

}

exports = module.exports = WKProvider;
