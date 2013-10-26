var sharp = require("./build/Release/sharp");

module.exports.crop = function(input, output, width, height, callback) {
  sharp.resize(input, output, width, height, "c", callback);
};

module.exports.embedWhite = function(input, output, width, height, callback) {
  sharp.resize(input, output, width, height, "w", callback);
};

module.exports.embedBlack = function(input, output, width, height, callback) {
  sharp.resize(input, output, width, height, "b", callback);
};
