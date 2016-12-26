'use strict';

module.exports = {
  produce: [
    {
      message: 'reject produce with missing param queue',
      params: {
        content: {},
      },
    },
    {
      message: 'reject produce with missing param content',
      params: {
        queue: 'test',
      },
    },
    {
      message: 'reject produce with wrong param type content',
      params: {
        queue: 'test',
        content: 'abc',
      },
    },
    {
      message: 'reject produce with wrong param type queue',
      params: {
        queue: {},
        content: {},
      },
    },
  ],
  consume: [
    {
      message: 'reject consume with missing param queue',
      params: {
        cb: function() {},
      },
    },
    {
      message: 'reject consume with missing param cb',
      params: {
        queue: 'test',
      },
    },
    {
      message: 'reject consume with wrong param type queue',
      params: {
        queue: {},
        cb: function() {},
      },
    },
    {
      message: 'reject consume with wrong param type cb',
      params: {
        queue: 'test',
        cb: 123,
      },
    },
  ],
  subscribe: [
    {
      message: 'reject subscribe with missing param key',
      params: {
        cb: function() {},
      },
    },
    {
      message: 'reject subscribe with missing param cb',
      params: {
        key: 'test_key',
      },
    },
    {
      message: 'reject subscribe with wrong param type key',
      params: {
        key: {},
        cb: function() {},
      },
    },
    {
      message: 'reject subscribe with wrong param type cb',
      params: {
        key: 'test_key',
        cb: 'abc',
      },
    },
  ],
  publish: [
    {
      message: 'reject publish with missing param key',
      params: {
        content: {},
      },
    },
    {
      message: 'reject publish with missing param content',
      params: {
        key: 'test_key',
      },
    },
    {
      message: 'reject publish with wrong param type key',
      params: {
        key: {},
        content: {},
      },
    },
    {
      message: 'reject publish with wrong param type content',
      params: {
        key: 'test_key',
        content: 123,
      },
    },
  ],

};
