"use strict";

const q = require('q');

function rqProvider(){

}

rqProvider.prototype = {

  produce: function(obj){
    let deferred = q.defer();
    try {
      deferred.resolve(obj);
    } catch (err) {
      deferred.reject(err);
    }
    return deferred.promise;
  },

  consume: function(obj){
    let deferred = q.defer();
    try {
      deferred.resolve(obj);
    } catch (err) {
      deferred.reject(err);
    }
    return deferred.promise;
  },

  publish: function(obj){
    let deferred = q.defer();
    try {
      deferred.resolve(obj);
    } catch (err) {
      deferred.reject(err);
    }
    return deferred.promise;
  },

  subscribe: function(obj){
    let deferred = q.defer();
    try {
      deferred.resolve(obj);
    } catch (err) {
      deferred.reject(err);
    }
    return deferred.promise;
  }

};

exports = module.exports = rqProvider;