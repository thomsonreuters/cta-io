'use strict';

const o = require('../../../../../common');

describe('unit: rabbitmq provider singleton', function() {
  it('should return a new instance', function() {
    const one = new o.RmqProvider({newInstance: true});
    one.time = Date.now();
    const two = new o.RmqProvider({newInstance: true});
    o.assert(!two.time);
  });

  it('should return a same instance', function() {
    const three = new o.RmqProvider();
    const id = o.shortid.generate();
    const time = Date.now();
    three[id] = time;
    const four = new o.RmqProvider();
    o.assert.property(four, id);
    o.assert.strictEqual(four[id], time);
  });
});
