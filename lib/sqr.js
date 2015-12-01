"use strict";

const sqr = function(provider, options){
  // TODO validate params
  this.provider = provider;
  this.options = options;
};

sqr.prototype.produce = function(obj){
  // TODO validate params
  return this.provider.produce(obj);
};

sqr.prototype.consume = function(obj){
  // TODO validate params
  return this.provider.consume(obj);
};

sqr.prototype.publish = function(obj){
  // TODO validate params
  return this.provider.publish(obj);
};

sqr.prototype.subscribe = function(obj){
  // TODO validate params
  return this.provider.subscribe(obj);
};

module.exports = sqr;