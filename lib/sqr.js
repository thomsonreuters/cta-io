'use strict';

class Sqr {

  constructor(provider, options) {
    this.provider = provider;
    this.options = options;
  }

  produce(obj) {
    return this.provider.produce(obj);
  }

  consume(obj) {
    return this.provider.consume(obj);
  }

  publish(obj) {
    return this.provider.publish(obj);
  }

  subscribe(obj) {
    return this.provider.subscribe(obj);
  }

}

module.exports = Sqr;
