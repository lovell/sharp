'use strict';

var path = require('path');
var util = require('util');
var stream = require('stream');
var events = require('events');

var semver = require('semver');
var color = require('color');
var BluebirdPromise = require('bluebird');

var sharp = require('./build/Release/sharp');

// Versioning
var versions = {
  vips: sharp.libvipsVersion()
};
(function() {
  // Does libvips meet minimum requirement?
  var libvipsVersionMin = require('./package.json').config.libvips;
  if (semver.lt(versions.vips, libvipsVersionMin)) {
    throw new Error('Found libvips ' + versions.vips + ' but require at least ' + libvipsVersionMin);
  }
  // Include versions of dependencies, if present
  try {
    versions = require('./lib/versions.json');
  } catch (err) {}
})();

// Limits
var maximum = {
  width: 0x3FFF,
  height: 0x3FFF,
  pixels: Math.pow(0x3FFF, 2)
};

// Constructor-factory
var Sharp = function(input, options) {
  if (!(this instanceof Sharp)) {
    return new Sharp(input, options);
  }
  stream.Duplex.call(this);
  this.options = {
    // input options
    bufferIn: null,
    streamIn: false,
    sequentialRead: false,
    limitInputPixels: maximum.pixels,
    density: '72',
    rawWidth: 0,
    rawHeight: 0,
    rawChannels: 0,
    // ICC profiles
    iccProfilePath: path.join(__dirname, 'icc') + path.sep,
    // resize options
    topOffsetPre: -1,
    leftOffsetPre: -1,
    widthPre: -1,
    heightPre: -1,
    topOffsetPost: -1,
    leftOffsetPost: -1,
    widthPost: -1,
    heightPost: -1,
    width: -1,
    height: -1,
    canvas: 'crop',
    gravity: 0,
    angle: 0,
    rotateBeforePreExtract: false,
    flip: false,
    flop: false,
    withoutEnlargement: false,
    interpolator: 'bicubic',
    // operations
    background: [0, 0, 0, 255],
    flatten: false,
    negate: false,
    blurSigma: 0,
    sharpenRadius: 0,
    sharpenFlat: 1,
    sharpenJagged: 2,
    threshold: 0,
    gamma: 0,
    greyscale: false,
    normalize: 0,
    // overlay
    overlayPath: '',
    // output options
    formatOut: 'input',
    fileOut: '',
    progressive: false,
    quality: 80,
    compressionLevel: 6,
    withoutAdaptiveFiltering: false,
    withoutChromaSubsampling: false,
    trellisQuantisation: false,
    overshootDeringing: false,
    optimiseScans: false,
    streamOut: false,
    withMetadata: false,
    withMetadataOrientation: -1,
    tileSize: 256,
    tileOverlap: 0,
    // Function to notify of queue length changes
    queueListener: function(queueLength) {
      module.exports.queue.emit('change', queueLength);
    }
  };
  if (typeof input === 'string') {
    // input=file
    this.options.fileIn = input;
  } else if (typeof input === 'object' && input instanceof Buffer) {
    // input=buffer
    this.options.bufferIn = input;
  } else if (typeof input === 'undefined' || input === null) {
    // input=stream
    this.options.streamIn = true;
  } else {
    throw new Error('Unsupported input ' + typeof input);
  }
  this._inputOptions(options);
  return this;
};
module.exports = Sharp;
util.inherits(Sharp, stream.Duplex);

/*
  EventEmitter singleton emits queue length 'change' events
*/
module.exports.queue = new events.EventEmitter();

/*
  Supported image formats
*/
module.exports.format = sharp.format();

/*
  Version numbers of libvips and its dependencies
*/
module.exports.versions = versions;

/*
  Validation helpers
*/
var isDefined = function(val) {
  return typeof val !== 'undefined' && val !== null;
};
var isObject = function(val) {
  return typeof val === 'object';
};
var isInteger = function(val) {
  return typeof val === 'number' && !Number.isNaN(val) && val % 1 === 0;
};
var inRange = function(val, min, max) {
  return val >= min && val <= max;
};

/*
  Set input-related options
    density: DPI at which to load vector images via libmagick
*/
Sharp.prototype._inputOptions = function(options) {
  if (isObject(options)) {
    // Density
    if (isDefined(options.density)) {
      if (isInteger(options.density) && inRange(options.density, 1, 2400)) {
        this.options.density = options.density.toString();
      } else {
        throw new Error('Invalid density (1 to 2400) ' + options.density);
      }
    }
    // Raw pixel input
    if (isDefined(options.raw)) {
      if (
        isObject(options.raw) &&
        isInteger(options.raw.width) && inRange(options.raw.width, 1, maximum.width) &&
        isInteger(options.raw.height) && inRange(options.raw.height, 1, maximum.height) &&
        isInteger(options.raw.channels) && inRange(options.raw.channels, 1, 4)
      ) {
        this.options.rawWidth = options.raw.width;
        this.options.rawHeight = options.raw.height;
        this.options.rawChannels = options.raw.channels;
      } else {
        throw new Error('Expected width, height and channels for raw pixel input');
      }
    }
  } else if (isDefined(options)) {
    throw new Error('Invalid input options ' + options);
  }
};

/*
  Handle incoming chunk on Writable Stream
*/
Sharp.prototype._write = function(chunk, encoding, callback) {
  /*jslint unused: false */
  if (this.options.streamIn) {
    if (typeof chunk === 'object' && chunk instanceof Buffer) {
      if (this.options.bufferIn instanceof Buffer) {
        // Append to existing Buffer
        this.options.bufferIn = Buffer.concat(
          [this.options.bufferIn, chunk],
          this.options.bufferIn.length + chunk.length
        );
      } else {
        // Create new Buffer
        this.options.bufferIn = new Buffer(chunk.length);
        chunk.copy(this.options.bufferIn);
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
module.exports.gravity = {
  'center': 0,
  'centre': 0,
  'north': 1,
  'east': 2,
  'south': 3,
  'west': 4,
  'northeast': 5,
  'southeast': 6,
  'southwest': 7,
  'northwest': 8
};

Sharp.prototype.crop = function(gravity) {
  this.options.canvas = 'crop';
  if (typeof gravity === 'undefined') {
    this.options.gravity = module.exports.gravity.center;
  } else if (typeof gravity === 'number' && !Number.isNaN(gravity) && gravity >= 0 && gravity <= 8) {
    this.options.gravity = gravity;
  } else if (typeof gravity === 'string' && typeof module.exports.gravity[gravity] === 'number') {
    this.options.gravity = module.exports.gravity[gravity];
  } else {
    throw new Error('Unsupported crop gravity ' + gravity);
  }
  return this;
};

Sharp.prototype.extract = function(options) {
  if (!options || typeof options !== 'object') {
    // Legacy extract(top,left,width,height) syntax
    options = {
      left: arguments[1],
      top: arguments[0],
      width: arguments[2],
      height: arguments[3]
    };
  }
  var suffix = this.options.width === -1 && this.options.height === -1 ? 'Pre' : 'Post';
  ['left', 'top', 'width', 'height'].forEach(function (name) {
    var value = options[name];
    if (typeof value === 'number' && !Number.isNaN(value) && value % 1 === 0 && value >= 0) {
      this.options[name + (name === 'left' || name === 'top' ? 'Offset' : '') + suffix] = value;
    } else {
      throw new Error('Non-integer value for ' + name + ' of ' + value);
    }
  }, this);
  // Ensure existing rotation occurs before pre-resize extraction
  if (suffix === 'Pre' && this.options.angle !== 0) {
    this.options.rotateBeforePreExtract = true;
  }
  return this;
};

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
  this.options.canvas = 'embed';
  return this;
};

Sharp.prototype.max = function() {
  this.options.canvas = 'max';
  return this;
};

Sharp.prototype.min = function() {
  this.options.canvas = 'min';
  return this;
};

/*
  Ignoring the aspect ratio of the input, stretch the image to
  the exact width and/or height provided via the resize method.
*/
Sharp.prototype.ignoreAspectRatio = function() {
  this.options.canvas = 'ignore_aspect';
  return this;
};

Sharp.prototype.flatten = function(flatten) {
  this.options.flatten = (typeof flatten === 'boolean') ? flatten : true;
  return this;
};

Sharp.prototype.negate = function(negate) {
  this.options.negate = (typeof negate === 'boolean') ? negate : true;
  return this;
};

Sharp.prototype.overlayWith = function(overlayPath) {
  if (typeof overlayPath !== 'string') {
    throw new Error('The overlay path must be a string');
  }
  if (overlayPath === '') {
    throw new Error('The overlay path cannot be empty');
  }
  this.options.overlayPath = overlayPath;
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
  Flip the image vertically, about the Y axis
*/
Sharp.prototype.flip = function(flip) {
  this.options.flip = (typeof flip === 'boolean') ? flip : true;
  return this;
};

/*
  Flop the image horizontally, about the X axis
*/
Sharp.prototype.flop = function(flop) {
  this.options.flop = (typeof flop === 'boolean') ? flop : true;
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

/*
  Blur the output image.
  Call without a sigma to use a fast, mild blur.
  Call with a sigma to use a slower, more accurate Gaussian blur.
*/
Sharp.prototype.blur = function(sigma) {
  if (typeof sigma === 'undefined') {
    // No arguments: default to mild blur
    this.options.blurSigma = -1;
  } else if (typeof sigma === 'boolean') {
    // Boolean argument: apply mild blur?
    this.options.blurSigma = sigma ? -1 : 0;
  } else if (typeof sigma === 'number' && !Number.isNaN(sigma) && sigma >= 0.3 && sigma <= 1000) {
    // Numeric argument: specific sigma
    this.options.blurSigma = sigma;
  } else {
    throw new Error('Invalid blur sigma (0.3 to 1000.0) ' + sigma);
  }
  return this;
};

/*
  Sharpen the output image.
  Call without a radius to use a fast, mild sharpen.
  Call with a radius to use a slow, accurate sharpen using the L of LAB colour space.
    radius - size of mask in pixels, must be integer
    flat - level of "flat" area sharpen, default 1
    jagged - level of "jagged" area sharpen, default 2
*/
Sharp.prototype.sharpen = function(radius, flat, jagged) {
  if (typeof radius === 'undefined') {
    // No arguments: default to mild sharpen
    this.options.sharpenRadius = -1;
  } else if (typeof radius === 'boolean') {
    // Boolean argument: apply mild sharpen?
    this.options.sharpenRadius = radius ? -1 : 0;
  } else if (typeof radius === 'number' && !Number.isNaN(radius) && (radius % 1 === 0) && radius >= 1) {
    // Numeric argument: specific radius
    this.options.sharpenRadius = radius;
    // Control over flat areas
    if (typeof flat !== 'undefined' && flat !== null) {
      if (typeof flat === 'number' && !Number.isNaN(flat) && flat >= 0) {
        this.options.sharpenFlat = flat;
      } else {
        throw new Error('Invalid sharpen level for flat areas ' + flat + ' (expected >= 0)');
      }
    }
    // Control over jagged areas
    if (typeof jagged !== 'undefined' && jagged !== null) {
      if (typeof jagged === 'number' && !Number.isNaN(jagged) && jagged >= 0) {
        this.options.sharpenJagged = jagged;
      } else {
        throw new Error('Invalid sharpen level for jagged areas ' + jagged + ' (expected >= 0)');
      }
    }
  } else {
    throw new Error('Invalid sharpen radius ' + radius + ' (expected integer >= 1)');
  }
  return this;
};

Sharp.prototype.threshold = function(threshold) {
  if (typeof threshold === 'undefined') {
    this.options.threshold = 128;
  } else if (typeof threshold === 'boolean') {
    this.options.threshold = threshold ? 128 : 0;
  } else if (typeof threshold === 'number' && !Number.isNaN(threshold) && (threshold % 1 === 0) && threshold >= 0 && threshold <= 255) {
    this.options.threshold = threshold;
  } else {
    throw new Error('Invalid threshold (0 to 255) ' + threshold);
  }
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
  var isValid = false;
  for (var key in module.exports.interpolator) {
    if (module.exports.interpolator[key] === interpolator) {
      isValid = true;
      break;
    }
  }
  if (isValid) {
    this.options.interpolator = interpolator;
  } else {
    throw new Error('Invalid interpolator ' + interpolator);
  }
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
  Enhance output image contrast by stretching its luminance to cover the full dynamic range
*/
Sharp.prototype.normalize = function(normalize) {
  this.options.normalize = (typeof normalize === 'boolean') ? normalize : true;
  return this;
};
Sharp.prototype.normalise = Sharp.prototype.normalize;

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
  if (!Number.isNaN(quality) && quality >= 1 && quality <= 100 && quality % 1 === 0) {
    this.options.quality = quality;
  } else {
    throw new Error('Invalid quality (1 to 100) ' + quality);
  }
  return this;
};

/*
  zlib compression level for PNG output
*/
Sharp.prototype.compressionLevel = function(compressionLevel) {
  if (!Number.isNaN(compressionLevel) && compressionLevel >= 0 && compressionLevel <= 9) {
    this.options.compressionLevel = compressionLevel;
  } else {
    throw new Error('Invalid compressionLevel (0 to 9) ' + compressionLevel);
  }
  return this;
};

/*
  Disable the use of adaptive row filtering for PNG output
*/
Sharp.prototype.withoutAdaptiveFiltering = function(withoutAdaptiveFiltering) {
  this.options.withoutAdaptiveFiltering = (typeof withoutAdaptiveFiltering === 'boolean') ? withoutAdaptiveFiltering : true;
  return this;
};

/*
  Disable the use of chroma subsampling for JPEG output
*/
Sharp.prototype.withoutChromaSubsampling = function(withoutChromaSubsampling) {
  this.options.withoutChromaSubsampling = (typeof withoutChromaSubsampling === 'boolean') ? withoutChromaSubsampling : true;
  return this;
};

/*
  Apply trellis quantisation to JPEG output - requires mozjpeg 3.0+
*/
Sharp.prototype.trellisQuantisation = function(trellisQuantisation) {
  this.options.trellisQuantisation = (typeof trellisQuantisation === 'boolean') ? trellisQuantisation : true;
  return this;
};
Sharp.prototype.trellisQuantization = Sharp.prototype.trellisQuantisation;

/*
  Apply overshoot deringing to JPEG output - requires mozjpeg 3.0+
*/
Sharp.prototype.overshootDeringing = function(overshootDeringing) {
  this.options.overshootDeringing = (typeof overshootDeringing === 'boolean') ? overshootDeringing : true;
  return this;
};

/*
  Optimise scans in progressive JPEG output - requires mozjpeg 3.0+
*/
Sharp.prototype.optimiseScans = function(optimiseScans) {
  this.options.optimiseScans = (typeof optimiseScans === 'boolean') ? optimiseScans : true;
  if (this.options.optimiseScans) {
    this.progressive();
  }
  return this;
};
Sharp.prototype.optimizeScans = Sharp.prototype.optimiseScans;

/*
  Include all metadata (EXIF, XMP, IPTC) from the input image in the output image
  Optionally provide an Object with attributes to update:
    orientation: numeric value for EXIF Orientation tag
*/
Sharp.prototype.withMetadata = function(withMetadata) {
  this.options.withMetadata = (typeof withMetadata === 'boolean') ? withMetadata : true;
  if (typeof withMetadata === 'object') {
    if ('orientation' in withMetadata) {
      if (
        typeof withMetadata.orientation === 'number' &&
        !Number.isNaN(withMetadata.orientation) &&
        withMetadata.orientation % 1 === 0 &&
        withMetadata.orientation >= 0 &&
        withMetadata.orientation <= 7
      ) {
        this.options.withMetadataOrientation = withMetadata.orientation;
      } else {
        throw new Error('Invalid orientation (0 to 7) ' + withMetadata.orientation);
      }
    }
  }
  return this;
};

/*
  Tile size and overlap for Deep Zoom output
*/
Sharp.prototype.tile = function(size, overlap) {
  // Size of square tiles, in pixels
  if (typeof size !== 'undefined' && size !== null) {
    if (!Number.isNaN(size) && size % 1 === 0 && size >= 1 && size <= 8192) {
      this.options.tileSize = size;
    } else {
      throw new Error('Invalid tile size (1 to 8192) ' + size);
    }
  }
  // Overlap of tiles, in pixels
  if (typeof overlap !== 'undefined' && overlap !== null) {
    if (!Number.isNaN(overlap) && overlap % 1 === 0 && overlap >= 0 && overlap <= 8192) {
      if (overlap > this.options.tileSize) {
        throw new Error('Tile overlap ' + overlap + ' cannot be larger than tile size ' + this.options.tileSize);
      }
      this.options.tileOverlap = overlap;
    } else {
      throw new Error('Invalid tile overlap (0 to 8192) ' + overlap);
    }
  }
  return this;
};

Sharp.prototype.resize = function(width, height) {
  if (!width) {
    this.options.width = -1;
  } else {
    if (typeof width === 'number' && !Number.isNaN(width) && width % 1 === 0 && width > 0 && width <= maximum.width) {
      this.options.width = width;
    } else {
      throw new Error('Invalid width (1 to ' + maximum.width + ') ' + width);
    }
  }
  if (!height) {
    this.options.height = -1;
  } else {
    if (typeof height === 'number' && !Number.isNaN(height) && height % 1 === 0 && height > 0 && height <= maximum.height) {
      this.options.height = height;
    } else {
      throw new Error('Invalid height (1 to ' + maximum.height + ') ' + height);
    }
  }
  return this;
};

/*
  Limit the total number of pixels for input images
  Assumes the image dimensions contained in the file header can be trusted
*/
Sharp.prototype.limitInputPixels = function(limit) {
  if (typeof limit === 'number' && !Number.isNaN(limit) && limit % 1 === 0 && limit > 0) {
    this.options.limitInputPixels = limit;
  } else {
    throw new Error('Invalid pixel limit (1 to ' + maximum.pixels + ') ' + limit);
  }
  return this;
};

/*
  Write output image data to a file
*/
Sharp.prototype.toFile = function(fileOut, callback) {
  if (!fileOut || fileOut.length === 0) {
    var errOutputInvalid = new Error('Invalid output');
    if (typeof callback === 'function') {
      callback(errOutputInvalid);
    } else {
      return BluebirdPromise.reject(errOutputInvalid);
    }
  } else {
    if (this.options.fileIn === fileOut) {
      var errOutputIsInput = new Error('Cannot use same file for input and output');
      if (typeof callback === 'function') {
        callback(errOutputIsInput);
      } else {
        return BluebirdPromise.reject(errOutputIsInput);
      }
    } else {
      this.options.fileOut = fileOut;
      return this._pipeline(callback);
    }
  }
  return this;
};

/*
  Write output to a Buffer
*/
Sharp.prototype.toBuffer = function(callback) {
  return this._pipeline(callback);
};

/*
  Force JPEG output
*/
Sharp.prototype.jpeg = function() {
  this.options.formatOut = 'jpeg';
  return this;
};

/*
  Force PNG output
*/
Sharp.prototype.png = function() {
  this.options.formatOut = 'png';
  return this;
};

/*
  Force WebP output
*/
Sharp.prototype.webp = function() {
  this.options.formatOut = 'webp';
  return this;
};

/*
  Force raw, uint8 output
*/
Sharp.prototype.raw = function() {
  this.options.formatOut = 'raw';
  return this;
};

/*
  Force output to a given format
  @param format is either the id as a String or an Object with an 'id' attribute
*/
Sharp.prototype.toFormat = function(formatOut) {
  if (isObject(formatOut) && isDefined(formatOut.id)) {
    formatOut = formatOut.id;
  }
  if (
    isDefined(formatOut) &&
    ['jpeg', 'png', 'webp', 'raw', 'tiff', 'dz', 'input'].indexOf(formatOut) !== -1
  ) {
    this.options.formatOut = formatOut;
  } else {
    throw new Error('Unsupported output format ' + formatOut);
  }
  return this;
};

/*
  Used by a Writable Stream to notify that it is ready for data
*/
Sharp.prototype._read = function() {
  if (!this.options.streamOut) {
    this.options.streamOut = true;
    this._pipeline();
  }
};

/*
  Invoke the C++ image processing pipeline
  Supports callback, stream and promise variants
*/
Sharp.prototype._pipeline = function(callback) {
  var that = this;
  if (typeof callback === 'function') {
    // output=file/buffer
    if (this.options.streamIn) {
      // output=file/buffer, input=stream
      this.on('finish', function() {
        sharp.pipeline(that.options, callback);
      });
    } else {
      // output=file/buffer, input=file/buffer
      sharp.pipeline(this.options, callback);
    }
    return this;
  } else if (this.options.streamOut) {
    // output=stream
    if (this.options.streamIn) {
      // output=stream, input=stream
      this.on('finish', function() {
        sharp.pipeline(that.options, function(err, data) {
          if (err) {
            that.emit('error', err);
          } else {
            that.push(data);
          }
          that.push(null);
        });
      });
    } else {
      // output=stream, input=file/buffer
      sharp.pipeline(this.options, function(err, data) {
        if (err) {
          that.emit('error', err);
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
      return new BluebirdPromise(function(resolve, reject) {
        that.on('finish', function() {
          sharp.pipeline(that.options, function(err, data) {
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
      return new BluebirdPromise(function(resolve, reject) {
        sharp.pipeline(that.options, function(err, data) {
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
      return new BluebirdPromise(function(resolve, reject) {
        that.on('finish', function() {
          sharp.metadata(that.options, function(err, metadata) {
            if (err) {
              reject(err);
            } else {
              resolve(metadata);
            }
          });
        });
      });
    } else {
      return new BluebirdPromise(function(resolve, reject) {
        sharp.metadata(that.options, function(err, metadata) {
          if (err) {
            reject(err);
          } else {
            resolve(metadata);
          }
        });
      });
    }
  }
};

/*
  Clone new instance using existing options.
  Cloned instances share the same input.
*/
Sharp.prototype.clone = function() {
  // Clone existing options
  var clone = new Sharp();
  util._extend(clone.options, this.options);
  // Pass 'finish' event to clone for Stream-based input
  this.on('finish', function() {
    // Clone inherits input data
    clone.options.bufferIn = this.options.bufferIn;
    clone.emit('finish');
  });
  return clone;
};

/**
  Get and set cache memory, file and item limits
*/
module.exports.cache = function(options) {
  if (typeof options === 'boolean') {
    if (options) {
      // Default cache settings of 50MB, 20 files, 100 items
      return sharp.cache(50, 20, 100);
    } else {
      return sharp.cache(0, 0, 0);
    }
  } else if (typeof options === 'object') {
    return sharp.cache(options.memory, options.files, options.items);
  } else {
    return sharp.cache();
  }
};
// Ensure default cache settings are set
module.exports.cache(true);

/*
  Get and set size of thread pool
*/
module.exports.concurrency = function(concurrency) {
  if (typeof concurrency !== 'number' || Number.isNaN(concurrency)) {
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

/*
  Get and set use of SIMD vector unit instructions
*/
module.exports.simd = function(simd) {
  if (typeof simd !== 'boolean') {
    simd = null;
  }
  return sharp.simd(simd);
};
// Switch off default
module.exports.simd(false);
