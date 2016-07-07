'use strict';

const path = require('path');
const fs = require('fs');

const main = {};

const files = fs.readdirSync(__dirname).filter(function(fileName) {
  return /\.js$/.test(fileName) && fileName !== 'index.js';
});

files.forEach(function(fileName) {
  const filePath = __dirname + path.sep + fileName;
  const module = require(filePath);
  const key = typeof module === 'function' ? fileName.replace(/\.js$/, '') : module.key;
  main[key] = typeof module === 'function' ? module : module.fn;
});

exports = module.exports = main;
