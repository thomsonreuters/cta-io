'use strict';

const o = require('../common');
// const Context = require('events').EventEmitter;

const cementHelper = {
  constructor: {
    name: 'CementHelper',
  },
  dependencies: {},
  createContext: function() {
    return {
      publish: function() {
      },
    };
  },
};

describe('constructor', () => {
  it('when all arguments are provided', () => {
    const input = {
      queue: 'in_queue',
      topic: 'in_topic',
    };
    const output = {
      queue: 'out_queue',
      topic: 'out_topic',
    };
    cementHelper.dependencies.messaging = require('cta-messaging')();
    const brick = new o.Lib(cementHelper, {
      name: 'cta-io',
      properties: {
        input: input,
        output: output,
      },
    });
    o.assert.deepEqual(brick.input, input);
    o.assert.deepEqual(brick.output, output);
    o.assert.property(brick.dependencies, 'messaging');
  });
});
