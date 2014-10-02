/*jslint node: true */
'use strict';

var util = require('util');
var stream = require('stream');

var color = require('color');
var Promise = require('bluebird');

var sharp = require('./build/Release/sharp');

var Sharp = function(input) {
  if (!(this instanceof Sharp)) {
    return new Sharp(input);
  }
  stream.Duplex.call(this);
  this.options = {
    // input options
    streamIn: false,
    sequentialRead: false,
    // resize options
    width: -1,
    height: -1,
    canvas: 'c',
    gravity: 0,
    angle: 0,
    withoutEnlargement: false,
    interpolator: 'bilinear',
    // operations
    background: [0, 0, 0, 255],
    flatten: false,
    sharpen: false,
    gamma: 0,
    greyscale: false,
    // output options
    output: '__input',
    progressive: false,
    quality: 80,
    compressionLevel: 6,
    streamOut: false,
    withMetadata: false
  };
  if (typeof input === 'string') {
    // input=file
    this.options.fileIn = input;
  } else if (typeof input === 'object' && input instanceof Buffer) {
    // input=buffer
    if (input.length > 0) {
      this.options.bufferIn = input;
    } else {
      throw new Error('Buffer is empty');
    }
  } else {
    // input=stream
    this.options.streamIn = true;
  }
  return this;
};
module.exports = Sharp;
util.inherits(Sharp, stream.Duplex);

/*
  Handle incoming chunk on Writable Stream
*/
Sharp.prototype._write = function(chunk, encoding, callback) {
  if (this.options.streamIn) {
    if (typeof chunk === 'object' || chunk instanceof Buffer) {
      if (typeof this.options.bufferIn === 'undefined') {
        // Create new Buffer
        this.options.bufferIn = new Buffer(chunk.length);
        chunk.copy(this.options.bufferIn);
      } else {
        // Append to existing Buffer
        this.options.bufferIn = Buffer.concat(
          [this.options.bufferIn, chunk],
          this.options.bufferIn.length + chunk.length
        );
      }
      callback();
    } else {
      callback(new Error('Non-Buffer data on Writable Stream'));
    }
  } else {
    callback(new Error('Unexpected data on Writable Stream'));
  }
};

// Crop this part of the resized image (Center/Centre, North, East, South, West)
module.exports.gravity = {'center': 0, 'centre': 0, 'north': 1, 'east': 2, 'south': 3, 'west': 4};

Sharp.prototype.crop = function(gravity) {
  this.options.canvas = 'c';
  if (typeof gravity !== 'undefined') {
    // Is this a supported gravity?
    if (!Number.isNaN(gravity) && gravity >= 0 && gravity <= 4) {
      this.options.gravity = gravity;
    } else {
      throw new Error('Unsupported crop gravity ' + gravity);
    }
  }
  return this;
};

/*
  Deprecated embed* methods, to be removed in v0.8.0
*/
Sharp.prototype.embedWhite = util.deprecate(function() {
  return this.background('white').embed();
}, "embedWhite() is deprecated, use background('white').embed() instead");
Sharp.prototype.embedBlack = util.deprecate(function() {
  return this.background('black').embed();
}, "embedBlack() is deprecated, use background('black').embed() instead");

/*
  Set the background colour for embed and flatten operations.
  Delegates to the 'Color' module, which can throw an Error
  but is liberal in what it accepts, clamping values to sensible min/max.
*/
Sharp.prototype.background = function(rgba) {
  var colour = color(rgba);
  this.options.background = colour.rgbArray();
  this.options.background.push(colour.alpha() * 255);
  return this;
};

Sharp.prototype.embed = function() {
  this.options.canvas = 'e';
  return this;
};

Sharp.prototype.max = function() {
  this.options.canvas = 'm';
  return this;
};

Sharp.prototype.flatten = function(flatten) {
  this.options.flatten = (typeof flatten === 'boolean') ? flatten : true;
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
    throw new Error('Unsupported angle (0, 90, 180, 270) ' + angle);
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

/*
  Set the interpolator to use for the affine transformation
*/
module.exports.interpolator = {
  nearest: 'nearest',
  bilinear: 'bilinear',
  bicubic: 'bicubic',
  nohalo: 'nohalo',
  locallyBoundedBicubic: 'lbb',
  vertexSplitQuadraticBasisSpline: 'vsqbs'
};
Sharp.prototype.interpolateWith = function(interpolator) {
  this.options.interpolator = interpolator;
  return this;
};

/*
  Darken image pre-resize (1/gamma) and brighten post-resize (gamma).
  Improves brightness of resized image in non-linear colour spaces.
*/
Sharp.prototype.gamma = function(gamma) {
  if (typeof gamma === 'undefined') {
    // Default gamma correction of 2.2 (sRGB)
    this.options.gamma = 2.2;
  } else if (!Number.isNaN(gamma) && gamma >= 1 && gamma <= 3) {
    this.options.gamma = gamma;
  } else {
    throw new Error('Invalid gamma correction (1.0 to 3.0) ' + gamma);
  }
  return this;
};

/*
  Convert to greyscale
*/
Sharp.prototype.greyscale = function(greyscale) {
  this.options.greyscale = (typeof greyscale === 'boolean') ? greyscale : true;
  return this;
};
Sharp.prototype.grayscale = Sharp.prototype.greyscale;

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
    throw new Error('Invalid quality (1 to 100) ' + quality);
  }
  return this;
};

Sharp.prototype.compressionLevel = function(compressionLevel) {
  if (!Number.isNaN(compressionLevel) && compressionLevel >= -1 && compressionLevel <= 9) {
    this.options.compressionLevel = compressionLevel;
  } else {
    throw new Error('Invalid compressionLevel (-1 to 9) ' + compressionLevel);
  }
  return this;
};

Sharp.prototype.withMetadata = function(withMetadata) {
    this.options.withMetadata = (typeof withMetadata === 'boolean') ? withMetadata : true;
    return this;
};

Sharp.prototype.resize = function(width, height) {
  if (!width) {
    this.options.width = -1;
  } else {
    if (!Number.isNaN(width)) {
      this.options.width = width;
    } else {
      throw new Error('Invalid width ' + width);
    }
  }
  if (!height) {
    this.options.height = -1;
  } else {
    if (!Number.isNaN(height)) {
      this.options.height = height;
    } else {
      throw new Error('Invalid height ' + height);
    }
  }
  return this;
};

/*
  Write output image data to a file
*/
Sharp.prototype.toFile = function(output, callback) {
  if (!output || output.length === 0) {
    var errOutputInvalid = new Error('Invalid output');
    if (typeof callback === 'function') {
      callback(errOutputInvalid);
    } else {
      return Promise.reject(errOutputInvalid);
    }
  } else {
    if (this.options.fileIn === output) {
      var errOutputIsInput = new Error('Cannot use same file for input and output');
      if (typeof callback === 'function') {
        callback(errOutputIsInput);
      } else {
        return Promise.reject(errOutputIsInput);
      }
    } else {
      this.options.output = output;
      return this._sharp(callback);
    }
  }
  return this;
};

Sharp.prototype.toBuffer = function(callback) {
  return this._sharp(callback);
};

Sharp.prototype.jpeg = function() {
  this.options.output = '__jpeg';
  return this;
};

Sharp.prototype.png = function() {
  this.options.output = '__png';
  return this;
};

Sharp.prototype.webp = function() {
  this.options.output = '__webp';
  return this;
};

/*
  Used by a Writable Stream to notify that it is ready for data
*/
Sharp.prototype._read = function() {
  if (!this.options.streamOut) {
    this.options.streamOut = true;
    this._sharp();
  }
};

/*
  Invoke the C++ image processing pipeline
  Supports callback, stream and promise variants
*/
Sharp.prototype._sharp = function(callback) {
  var that = this;
  if (typeof callback === 'function') {
    // output=file/buffer
    if (this.options.streamIn) {
      // output=file/buffer, input=stream
      this.on('finish', function() {
        sharp.resize(that.options, callback);
      });
    } else {
      // output=file/buffer, input=file/buffer
      sharp.resize(this.options, callback);
    }
    return this;
  } else if (this.options.streamOut) {
    // output=stream
    if (this.options.streamIn) {
      // output=stream, input=stream
      this.on('finish', function() {
        sharp.resize(that.options, function(err, data) {
          if (err) {
            that.emit('error', new Error(err));
          } else {
            that.push(data);
          }
          that.push(null);
        });
      });
    } else {
      // output=stream, input=file/buffer
      sharp.resize(this.options, function(err, data) {
        if (err) {
          that.emit('error', new Error(err));
        } else {
          that.push(data);
        }
        that.push(null);
      });
    }
    return this;
  } else {
    // output=promise
    if (this.options.streamIn) {
      // output=promise, input=stream
      return new Promise(function(resolve, reject) {
        that.on('finish', function() {
          sharp.resize(that.options, function(err, data) {
            if (err) {
              reject(err);
            } else {
              resolve(data);
            }
          });
        });
      });
    } else {
      // output=promise, input=file/buffer
      return new Promise(function(resolve, reject) {
        sharp.resize(that.options, function(err, data) {
          if (err) {
            reject(err);
          } else {
            resolve(data);
          }
        });
      });
    }
  }
};

/*
  Reads the image header and returns metadata
  Supports callback, stream and promise variants
*/
Sharp.prototype.metadata = function(callback) {
  var that = this;
  if (typeof callback === 'function') {
    if (this.options.streamIn) {
      this.on('finish', function() {
        sharp.metadata(that.options, callback);
      });
    } else {
      sharp.metadata(this.options, callback);
    }
    return this;
  } else {
    if (this.options.streamIn) {
      return new Promise(function(resolve, reject) {
        that.on('finish', function() {
          sharp.metadata(that.options, function(err, data) {
            if (err) {
              reject(err);
            } else {
              resolve(data);
            }
          });
        });
      });
    } else {
      return new Promise(function(resolve, reject) {
        sharp.metadata(that.options, function(err, data) {
          if (err) {
            reject(err);
          } else {
            resolve(data);
          }
        });
      });
    }
  }
};

/*
  Get and set cache memory and item limits
*/
module.exports.cache = function(memory, items) {
  if (Number.isNaN(memory)) {
    memory = null;
  }
  if (Number.isNaN(items)) {
    items = null;
  }
  return sharp.cache(memory, items);
};

/*
  Get and set size of thread pool
*/
module.exports.concurrency = function(concurrency) {
  if (Number.isNaN(concurrency)) {
    concurrency = null;
  }
  return sharp.concurrency(concurrency);
};

/*
  Get internal counters
*/
module.exports.counters = function() {
  return sharp.counters();
};
