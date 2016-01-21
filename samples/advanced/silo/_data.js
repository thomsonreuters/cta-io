'use strict';

module.exports = function(max) {
  const data = [];
  const to = isNaN(max) ? 5 : max;
  for (let i = 0; i < to; i++) {
    data.push(i);
  }
  return data;
};
