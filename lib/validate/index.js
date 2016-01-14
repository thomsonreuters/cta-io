'use strict';
/**
 * Validate an input object parameters with provided object pattern
 * @param {object} input - input object parameters
 * @return {object} - object pattern
 */
exports = module.exports = function(input, pattern) {
  let output = input;
  if (typeof pattern !== 'object') {
    throw new Error('validate module => invalid pattern object');
  }
  let optionals = 0;
  Object.keys(pattern).forEach(function(e) {
    if (typeof pattern[e] === 'object' && pattern[e].optional === true) {
      optionals++;
    }
  });
  if (output === null || typeof output !== 'object') {
    if (Object.keys(pattern).length !== optionals) {
      throw new Error('validate module => invalid input object');
    }
    output = {};
  }
  for (const key in pattern) {
    if (!pattern.hasOwnProperty(key)) {
      continue;
    }
    const val = pattern[key];
    if (!(key in output)) {
      // is it mandatory?
      if (typeof val === 'string') {
        throw new Error('validate module => missing parameter "' + key + '"');
      // is it optional?
      } else if (val.optional && 'defaultTo' in val) {
        output[key] = val.defaultTo;
      }
    } else {
      const type = (typeof val === 'string') ? val : val.type;
      if (typeof output[key] !== type) {
        throw new Error('validate module => invalid parameter type "' + key + '", provided "' + typeof output[key] + '", expected "' + type + '"');
      }
    }
  }
  return output;
};
