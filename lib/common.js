module.exports = {
  bufferToJSON: function(buffer) {
    return JSON.parse(buffer.toString());
  },
  jsonToBuffer: function(json) {
    return new Buffer(JSON.stringify(json));
  },
};
