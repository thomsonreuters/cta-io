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

  start() {
    const that = this;
    setInterval(() => {
      const data = {
        id: shortid.generate(),
        nature: {
          type: 'messages',
          quality: 'produce',
        },
        payload: {
          id: shortid.generate(),
          date: new Date().toISOString(),
        },
      };
      that.cementHelper.createContext(data).publish();
    }, 1000);
  }
}

module.exports = Broker;
