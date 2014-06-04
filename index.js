/*jslint node: true */
'use strict';

var Promise = require('bluebird');
var deprecate = require('util-deprecate');
var sharp = require('./build/Release/sharp');

var Sharp = function(input) {
  if (!(this instanceof Sharp)) {
    return new Sharp(input);
  }
  this.options = {
    width: -1,
    height: -1,
    canvas: 'c',
    angle: 0,
    withoutEnlargement: false,
    sharpen: false,
    progressive: false,
    sequentialRead: false,
		quality: 80,
		compressionLevel: 6,
    output: '__jpeg'
  };
  if (typeof input === 'string') {
    this.options.fileIn = input;
  } else if (typeof input ==='object' && input instanceof Buffer) {
    if (input.length > 0) {
      this.options.bufferIn = input;
    } else {
      throw 'Buffer is empty';
    }
  } else {
    throw 'Unsupported input ' + typeof input;
  }
  return this;
};
module.exports = Sharp;

Sharp.prototype.crop = function() {
  this.options.canvas = 'c';
  return this;
};

Sharp.prototype.embedWhite = function() {
  this.options.canvas = 'w';
  return this;
};

Sharp.prototype.embedBlack = function() {
  this.options.canvas = 'b';
  return this;
};

Sharp.prototype.max = function() {
  this.options.canvas = 'm';
  return this;
};

/*
  Rotate output image by 0, 90, 180 or 270 degrees
  Auto-rotation based on the EXIF Orientation tag is represented by an angle of -1
*/
Sharp.prototype.rotate = function(angle) {
  if (typeof angle === 'undefined') {
    this.options.angle = -1;
  } else if (!Number.isNaN(angle) && [0, 90, 180, 270].indexOf(angle) !== -1) {
    this.options.angle = angle;
  } else {
    throw 'Unsupport angle (0, 90, 180, 270) ' + angle;
  }
  return this;
};

/*
  Do not enlarge the output if the input width *or* height are already less than the required dimensions
  This is equivalent to GraphicsMagick's ">" geometry option:
    "change the dimensions of the image only if its width or height exceeds the geometry specification"
*/
Sharp.prototype.withoutEnlargement = function(withoutEnlargement) {
  this.options.withoutEnlargement = (typeof withoutEnlargement === 'boolean') ? withoutEnlargement : true;
  return this;
};

Sharp.prototype.sharpen = function(sharpen) {
  this.options.sharpen = (typeof sharpen === 'boolean') ? sharpen : true;
  return this;
};

Sharp.prototype.progressive = function(progressive) {
  this.options.progressive = (typeof progressive === 'boolean') ? progressive : true;
  return this;
};

Sharp.prototype.sequentialRead = function(sequentialRead) {
  this.options.sequentialRead = (typeof sequentialRead === 'boolean') ? sequentialRead : true;
  return this;
};

Sharp.prototype.quality = function(quality) {
  if (!Number.isNaN(quality) && quality >= 1 && quality <= 100) {
    this.options.quality = quality;
  } else {
    throw 'Invalid quality (1 to 100) ' + quality;
  }
  return this;
};

Sharp.prototype.compressionLevel = function(compressionLevel) {
  if (!Number.isNaN(compressionLevel) && compressionLevel >= -1 && compressionLevel <= 9) {
    this.options.compressionLevel = compressionLevel;
  } else {
    throw 'Invalid compressionLevel (-1 to 9) ' + compressionLevel;
  }
  return this;
};

Sharp.prototype.resize = function(width, height) {
  if (!width) {
    this.options.width = -1;
  } else {
    if (!Number.isNaN(width)) {
      this.options.width = width;
    } else {
      throw 'Invalid width ' + width;
    }
  }
  if (!height) {
    this.options.height = -1;
  } else {
    if (!Number.isNaN(height)) {
      this.options.height = height;
    } else {
      throw 'Invalid height ' + height;
    }
  }
  return this;
};

/*
  Write output image data to a file
*/
Sharp.prototype.toFile = function(output, callback) {
  if (!output || output.length === 0) {
    callback('Invalid output');
  } else {
    if (this.options.fileIn === output) {
      callback('Cannot use same file for input and output');
    } else {
      return this._sharp(output, callback);
    }
  }
  return this;
};

// Deprecated to make way for future stream support - remove in v0.6.0
Sharp.prototype.write = deprecate(Sharp.prototype.toFile, '.write() is deprecated and will be removed in v0.6.0. Use .toFile() instead.');

Sharp.prototype.toBuffer = function(callback) {
  return this._sharp('__input', callback);
};

Sharp.prototype.jpeg = function(callback) {
  return this._sharp('__jpeg', callback);
};

Sharp.prototype.png = function(callback) {
  return this._sharp('__png', callback);
};

Sharp.prototype.webp = function(callback) {
  return this._sharp('__webp', callback);
};

/*
  Invoke the C++ image processing pipeline
  Supports callback and promise variants
*/
Sharp.prototype._sharp = function(output, callback) {
  if (typeof callback === 'function') {
    // I like callbacks
    sharp.resize(this.options, output, callback);
    return this;
  } else {
    // I like promises
    var options = this.options;
    return new Promise(function(resolve, reject) {
      sharp.resize(options, output, function(err, data) {
        if (err) {
          reject(err);
        } else {
          resolve(data);
        }
      });
    });
  }
};

module.exports.cache = function(limit) {
  if (Number.isNaN(limit)) {
    limit = null;
  }
  return sharp.cache(limit);
};
