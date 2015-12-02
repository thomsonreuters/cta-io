'use strict';

function Sqr(provider, options) {
  // TODO validate params
  this.provider = provider;
  this.options = options;
}

Sqr.prototype.produce = function produce(obj) {
  // TODO validate params
  return this.provider.produce(obj);
};

Sqr.prototype.consume = function consume(obj) {
  // TODO validate params
  return this.provider.consume(obj);
};

Sqr.prototype.publish = function publish(obj) {
  // TODO validate params
  return this.provider.publish(obj);
};

Sqr.prototype.subscribe = function subscribe(obj) {
  // TODO validate params
  return this.provider.subscribe(obj);
};

module.exports = Sqr;
