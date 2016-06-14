'use strict';

const Brick = require('cta-brick');
const shortid = require('shortid');

class Broker extends Brick {
  constructor(cementHelper, config) {
    super(cementHelper, config);
  }

  validate(job) {
    return Promise.resolve(job);
  }

  process(context) {
    const that = this;
    try {
      if (context.data.nature.type === 'execution' && context.data.nature.quality === 'commandline') {
        const result = context.data.payload.x * context.data.payload.y;
        const data = {
          id: shortid.generate(),
          nature: {
            type: 'execution',
            quality: 'result',
          },
          payload: {
            operation: `${context.data.payload.x} * ${context.data.payload.y}`,
            result: result,
          },
        };
        // simulate job slowness
        setTimeout(function() {
          that.cementHelper.createContext(data).publish();
          context.emit('done', that.name, result);
        }, 5000);
      }
    } catch (err) {
      context.emit('reject', that.name, err);
      context.emit('error', that.name, err);
    }
  }
}

module.exports = Broker;
