'use strict';

exports = module.exports = function(oinput, pattern) {
  let input = oinput;
  if (typeof pattern !== 'object') {
    throw new Error('validate module => invalid pattern object');
  }
  let optionals = 0;
  Object.keys(pattern).forEach(function(e) {
    if (typeof pattern[e] === 'object' && pattern[e].optional === true) {
      optionals++;
    }
  });
  if (typeof input !== 'object') {
    if (Object.keys(pattern).length !== optionals) {
      throw new Error('validate module => invalid input object');
    }
    input = {};
  }
  for (const key in pattern) {
    if (!pattern.hasOwnProperty(key)) {
      continue;
    }
    const val = pattern[key];
    if (!(key in input)) {
      if (typeof val === 'string') {
        throw new Error('validate module => missing parameter "' + key + '"');
      }
      input[key] = val.defaultTo;
    } else {
      const type = (typeof val === 'string') ? val : val.type;
      if (typeof input[key] !== type) {
        throw new Error('validate module => invalid parameter type "' + key + '", provided "' + typeof input[key] + '", expected "' + type + '"');
      }
    }
  }
  return input;
};
