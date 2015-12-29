'use strict';

exports = module.exports = function(input, pattern) {
  let result = true;
  for (const key in pattern) {
    if (!pattern.hasOwnProperty(key)) {
      continue;
    }
    const val = pattern[key];
    if (!(key in input)) {
      if (typeof val === 'string') {
        result = 'Missing parameter "' + key + '"';
        break;
      } else {
        input[key] = val.defaultTo;
      }
    } else {
      const type = (typeof val === 'string') ? val : val.type;
      if (typeof input[key] !== type) {
        result = 'Invalid parameter type "' + key + '", provided "' + typeof input[key] + '", expected "' + type + '"';
        break;
      }
    }
  }
  return result;
};