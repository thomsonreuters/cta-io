'use strict';

const path = require('path');
const fs = require('fs');

const main = {};

const files = fs.readdirSync(__dirname).filter(function(fileName) {
  return /\.js$/.test(fileName) && fileName !== 'index.js';
});

files.forEach(function(fileName) {
  const filePath = __dirname + path.sep + fileName;
  const key = fileName.replace(/\.js$/, '');
  main[key] = require(filePath);
});

exports = module.exports = main;
