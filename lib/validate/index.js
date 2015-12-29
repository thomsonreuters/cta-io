'use strict';

exports = module.exports = function(input, pattern) {
  if (typeof input !== 'object') {
    return 'Invalid input object';
  }
  if (typeof pattern !== 'object') {
    return 'Invalid pattern object';
  }
  for (const key in pattern) {
    if (!pattern.hasOwnProperty(key)) {
      continue;
    }
    const val = pattern[key];
    if (!(key in input)) {
      if (typeof val === 'string') {
        return 'Missing parameter "' + key + '"';
      }
      input[key] = val.defaultTo;
    } else {
      const type = (typeof val === 'string') ? val : val.type;
      if (typeof input[key] !== type) {
        return 'Invalid parameter type "' + key + '", provided "' + typeof input[key] + '", expected "' + type + '"';
      }
    }
  }
  return true;
};