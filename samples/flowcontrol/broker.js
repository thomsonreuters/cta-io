'use strict';

const Brick = require('cta-brick');
const co = require('co');

class Broker extends Brick {
  constructor(cementHelper, config) {
    super(cementHelper, config);
  }

  validate(job) {
    return Promise.resolve(job);
  }

  process(context) {
    const that = this;
    return co(function* processCo() {
      if (context.data.nature.type === 'execution' && context.data.nature.quality === 'commandline') {
        const result = context.data.payload.x * context.data.payload.y;
        that.cementHelper.createContext({
          'nature': {
            'type': 'execution',
            'quality': 'result',
          },
          payload: {
            operation: `${context.data.payload.x} * ${context.data.payload.y}`,
            result: result,
          },
        }).publish();
      }
    });
  }
}

module.exports = Broker;

