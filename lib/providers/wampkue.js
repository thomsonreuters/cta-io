'use strict';

const q = require('q');
const autobahn = require('autobahn');
const kue = require('kue');
const queue = kue.createQueue();

class WKProvider {

  constructor(params) {
    this.url = params.url;
    this.realm = params.realm;
  }

  exec(cb) {
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

  produce(params) {
    const deferred = q.defer();
    const job = queue.create(params.queue, params.json)
      .save(function(err) {
        if (err) {
          deferred.reject(err);
        } else {
          console.log('Saved job with id ' + job.id);
          deferred.resolve();
        }
      });
    return deferred.promise;
  }

  consume(params) {
    const deferred = q.defer();
    queue.process(params.queue, function(job, done) {
      console.log('Found task, processing...');
      params.cb(job.data)
        .then(function() {
          done();
          deferred.resolve();
        }, function(err) {
          deferred.reject(err);
        });
    });
    return deferred.promise;
  }

  publish(params) {
    return this.exec(function(session) {
      const deferred = q.defer();
      session.publish(params.key, [params.json]);
      deferred.resolve();
      return deferred.promise;
    });
  }

  subscribe(params) {
    return this.exec(function(session) {
      const deferred = q.defer();
      session.subscribe(params.key, function(data) {
        let json = data;
        if (Array.isArray(data) && data.length && data[0]) {
          json = data[0];
        }
        params.cb(json);
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
