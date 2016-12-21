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
      const result = context.data.payload.x * context.data.payload.y;
      const data = {
        id: shortid.generate(),
        nature: {
          type: 'messages',
          quality: 'produce',
        },
        payload: {
          queue: 'output.queue',
          message: {
            operation: `${context.data.payload.x} * ${context.data.payload.y}`,
            result: result,
          },
        },
      };
      that.cementHelper.createContext(data).publish();
      context.emit('done', that.name, result);
    } catch (err) {
      context.emit('reject', that.name, err);
      context.emit('error', that.name, err);
    }
  }
}

module.exports = Broker;
