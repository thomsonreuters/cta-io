'use strict';

const path = require('path');
const fs = require('fs');

const providers = {};

const result = fs.readdirSync(__dirname).filter(function(file) {
  return fs.statSync(path.join(__dirname, file)).isDirectory();
});

result.forEach(function(dir) {
  const instance = require(path.resolve(__dirname, dir));
  let extra = null;
  try {
    extra = require(path.resolve(__dirname, dir, 'extra'));
  } catch (e) {
    console.log('no extra params found for provider ' + dir);
  }
  providers[dir] = {
    instance: instance,
    extra: extra,
  };
});

exports = module.exports = providers;
