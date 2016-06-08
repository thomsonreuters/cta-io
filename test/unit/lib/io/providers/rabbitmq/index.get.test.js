'use strict';

const o = require('../../../../../common');
describe('rabbitmq get', function() {
  it('should get message from queue', function (done) {
    return o.co(function* coroutine() {
      const io = new o.providers.rabbitmq();
      yield io.connect();
      const queue = o.shortid.generate();
      const json = {
        id: '01',
        timestamp: Date.now(),
      };
      yield io.produce({
        queue: queue,
        json: json,
      });
      let res = yield io.get({
        queue: queue,
      });
      o.assert.deepEqual(res.result.json, json);
      res = yield io.get({
        queue: queue,
      });
      o.assert.deepEqual(res.result.json, null);
      done();
    })
    .catch((err) => {
      done(err);
    });
  });
});
