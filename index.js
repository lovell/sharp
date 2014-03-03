var sharp = require("./build/Release/sharp");

module.exports.buffer = {
  jpeg: "__jpeg",
  png: "__png",
  webp: "__webp"
};

module.exports.canvas = {
  crop: "c",
  embedWhite: "w",
  embedBlack: "b"
};

module.exports.resize = function(input, output, width, height, options, callback) {
  "use strict";
  if (typeof options === 'function') {
    callback = options;
    options = {};
  } else {
    options = options || {};
  }
  if (typeof input === 'string') {
    options.inFile = input;
  } else if (typeof input ==='object' && input instanceof Buffer) {
    options.inBuffer = input;
  } else {
    callback("Unsupported input " + typeof input);
    return;
  }
  if (!output || output.length === 0) {
    callback("Invalid output");
    return;
  }
  var outWidth = Number(width);
  if (Number.isNaN(outWidth)) {
    callback("Invalid width " + width);
    return;
  }
  var outHeight = Number(height);
  if (Number.isNaN(outHeight)) {
    callback("Invalid height " + height);
    return;
  }
  if (outWidth < 1 && outHeight < 1) {
    callback("Width and/or height required");
    return;
  }
  var canvas = options.canvas || "c";
  if (canvas.length !== 1 || "cwb".indexOf(canvas) === -1) {
    callback("Invalid canvas " + canvas);
    return;
  }
  var sharpen = !!options.sharpen;
  var progessive = !!options.progessive;
  var sequentialRead = !!options.sequentialRead;
  sharp.resize(options.inFile, options.inBuffer, output, outWidth, outHeight, canvas, sharpen, progessive, sequentialRead, callback);
};

module.exports.cache = function(limit) {
  "use strict";
  if (Number.isNaN(limit)) {
    limit = null;
  }
  return sharp.cache(limit);
};

/* Deprecated v0.0.x methods */
module.exports.crop = function(input, output, width, height, sharpen, callback) {
  sharp.resize(input, output, width, height, {canvas: "c", sharpen: true}, callback);
};
module.exports.embedWhite = function(input, output, width, height, callback) {
  sharp.resize(input, output, width, height, {canvas: "w", sharpen: true}, callback);
};
module.exports.embedBlack = function(input, output, width, height, callback) {
  sharp.resize(input, output, width, height, {canvas: "b", sharpen: true}, callback);
};
