'use strict';

const path = require('path');
const fs = require('fs');

const providers = {};

const result = fs.readdirSync(__dirname).filter(function(file) {
  return fs.statSync(path.join(__dirname, file)).isDirectory();
});

result.forEach(function(dir) {
  providers[dir] = require(path.resolve(__dirname, dir));
});

exports = module.exports = providers;
