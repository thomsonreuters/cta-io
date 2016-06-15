'use strict';

const o = require('../../../../../common');
let two;

describe('unit: rabbitmq provider singleton', function() {
  it('should return a new instance', function() {
    const one = new o.RmqProvider({newInstance: true});
    one.time = Date.now();
    two = new o.RmqProvider({newInstance: true});
    o.assert(!two.time);
  });

  it('should return a same instance', function() {
    const id = o.shortid.generate();
    const time = Date.now();
    two[id] = time;
    const three = new o.RmqProvider();
    o.assert.property(three, id);
    o.assert.strictEqual(three[id], time);
  });
});
