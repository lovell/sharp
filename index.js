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
    bufferIn: [],
    streamIn: false,
    sequentialRead: false,
    limitInputPixels: maximum.pixels,
    density: 72,
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
    crop: 0,
    angle: 0,
    rotateBeforePreExtract: false,
    flip: false,
    flop: false,
    extendTop: 0,
    extendBottom: 0,
    extendLeft: 0,
    extendRight: 0,
    withoutEnlargement: false,
    kernel: 'lanczos3',
    interpolator: 'bicubic',
    // operations
    background: [0, 0, 0, 255],
    flatten: false,
    negate: false,
    blurSigma: 0,
    sharpenSigma: 0,
    sharpenFlat: 1,
    sharpenJagged: 2,
    threshold: 0,
    gamma: 0,
    greyscale: false,
    normalize: 0,
    // overlay
    overlayFileIn: '',
    overlayBufferIn: null,
    overlayGravity: 0,
    overlayTile: false,
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
  if (isString(input)) {
    // input=file
    this.options.fileIn = input;
  } else if (isBuffer(input)) {
    // input=buffer
    this.options.bufferIn = input;
  } else if (!isDefined(input)) {
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
var isBoolean = function(val) {
  return typeof val === 'boolean';
};
var isBuffer = function(val) {
  return typeof val === 'object' && val instanceof Buffer;
};
var isString = function(val) {
  return typeof val === 'string' && val.length > 0;
};
var isNumber = function(val) {
  return typeof val === 'number' && !Number.isNaN(val);
};
var isInteger = function(val) {
  return isNumber(val) && val % 1 === 0;
};
var inRange = function(val, min, max) {
  return val >= min && val <= max;
};
var contains = function(val, list) {
  return list.indexOf(val) !== -1;
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
        this.options.density = options.density;
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
    if (isBuffer(chunk)) {
      this.options.bufferIn.push(chunk);
      callback();
    } else {
      callback(new Error('Non-Buffer data on Writable Stream'));
    }
  } else {
    callback(new Error('Unexpected data on Writable Stream'));
  }
};

/*
  Flattens the array of chunks in bufferIn
*/
Sharp.prototype._flattenBufferIn = function() {
  if (Array.isArray(this.options.bufferIn)) {
    this.options.bufferIn = Buffer.concat(this.options.bufferIn);
  }
};

// Weighting to apply to image crop
module.exports.gravity = {
  center: 0,
  centre: 0,
  north: 1,
  east: 2,
  south: 3,
  west: 4,
  northeast: 5,
  southeast: 6,
  southwest: 7,
  northwest: 8
};

// Strategies for automagic behaviour
module.exports.strategy = {
  entropy: 16
};

/*
  What part of the image should be retained when cropping?
*/
Sharp.prototype.crop = function(crop) {
  this.options.canvas = 'crop';
  if (!isDefined(crop)) {
    // Default
    this.options.crop = module.exports.gravity.center;
  } else if (isInteger(crop) && inRange(crop, 0, 8)) {
    // Gravity (numeric)
    this.options.crop = crop;
  } else if (isString(crop) && isInteger(module.exports.gravity[crop])) {
    // Gravity (string)
    this.options.crop = module.exports.gravity[crop];
  } else if (isInteger(crop) && crop === module.exports.strategy.entropy) {
    // Strategy
    this.options.crop = crop;
  } else {
    throw new Error('Unsupported crop ' + crop);
  }
  return this;
};

Sharp.prototype.extract = function(options) {
  var suffix = this.options.width === -1 && this.options.height === -1 ? 'Pre' : 'Post';
  ['left', 'top', 'width', 'height'].forEach(function (name) {
    var value = options[name];
    if (isInteger(value) && value >= 0) {
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

/*
  Overlay with another image, using an optional gravity
*/
Sharp.prototype.overlayWith = function(overlay, options) {
  if (isString(overlay)) {
    this.options.overlayFileIn = overlay;
  } else if (isBuffer(overlay)) {
    this.options.overlayBufferIn = overlay;
  } else {
    throw new Error('Unsupported overlay ' + typeof overlay);
  }
  if (isObject(options)) {
    if (typeof options.tile === 'undefined') {
      this.options.overlayTile = false;
    }
    else if (isBoolean(options.tile)) {
      this.options.overlayTile = options.tile;
    } else {
      throw new Error(' Invalid Value for tile ' + options.tile + 'Only Boolean Values allowed for overlay.tile.');
    }
    
    if (isInteger(options.gravity) && inRange(options.gravity, 0, 8)) {
      this.options.overlayGravity = options.gravity;
    } else if (isString(options.gravity) && isInteger(module.exports.gravity[options.gravity])) {
      this.options.overlayGravity = module.exports.gravity[options.gravity];
    } else if (isDefined(options.gravity)) {
      throw new Error('Unsupported overlay gravity ' + options.gravity);
    }
  }
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
  if (!isDefined(sigma)) {
    // No arguments: default to mild blur
    this.options.blurSigma = -1;
  } else if (isBoolean(sigma)) {
    // Boolean argument: apply mild blur?
    this.options.blurSigma = sigma ? -1 : 0;
  } else if (isNumber(sigma) && inRange(sigma, 0.3, 1000)) {
    // Numeric argument: specific sigma
    this.options.blurSigma = sigma;
  } else {
    throw new Error('Invalid blur sigma (0.3 - 1000.0) ' + sigma);
  }
  return this;
};

/*
  Sharpen the output image.
  Call without a radius to use a fast, mild sharpen.
  Call with a radius to use a slow, accurate sharpen using the L of LAB colour space.
    sigma - sigma of mask
    flat - level of "flat" area sharpen, default 1
    jagged - level of "jagged" area sharpen, default 2
*/
Sharp.prototype.sharpen = function(sigma, flat, jagged) {
  if (!isDefined(sigma)) {
    // No arguments: default to mild sharpen
    this.options.sharpenSigma = -1;
  } else if (isBoolean(sigma)) {
    // Boolean argument: apply mild sharpen?
    this.options.sharpenSigma = sigma ? -1 : 0;
  } else if (isNumber(sigma) && inRange(sigma, 0.01, 10000)) {
    // Numeric argument: specific sigma
    this.options.sharpenSigma = sigma;
    // Control over flat areas
    if (isDefined(flat)) {
      if (isNumber(flat) && inRange(flat, 0, 10000)) {
        this.options.sharpenFlat = flat;
      } else {
        throw new Error('Invalid sharpen level for flat areas (0 - 10000) ' + flat);
      }
    }
    // Control over jagged areas
    if (isDefined(jagged)) {
      if (isNumber(jagged) && inRange(jagged, 0, 10000)) {
        this.options.sharpenJagged = jagged;
      } else {
        throw new Error('Invalid sharpen level for jagged areas (0 - 10000) ' + jagged);
      }
    }
  } else {
    throw new Error('Invalid sharpen sigma (0.01 - 10000) ' + sigma);
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
        withMetadata.orientation >= 1 &&
        withMetadata.orientation <= 8
      ) {
        this.options.withMetadataOrientation = withMetadata.orientation;
      } else {
        throw new Error('Invalid orientation (1 to 8) ' + withMetadata.orientation);
      }
    }
  }
  return this;
};

/*
  Tile-based deep zoom output options: size, overlap, layout
*/
Sharp.prototype.tile = function(tile) {
  if (isObject(tile)) {
    // Size of square tiles, in pixels
    if (isDefined(tile.size)) {
      if (isInteger(tile.size) && inRange(tile.size, 1, 8192)) {
        this.options.tileSize = tile.size;
      } else {
        throw new Error('Invalid tile size (1 to 8192) ' + tile.size);
      }
    }
    // Overlap of tiles, in pixels
    if (isDefined(tile.overlap)) {
      if (isInteger(tile.overlap) && inRange(tile.overlap, 0, 8192)) {
        if (tile.overlap > this.options.tileSize) {
          throw new Error('Tile overlap ' + tile.overlap + ' cannot be larger than tile size ' + this.options.tileSize);
        }
        this.options.tileOverlap = tile.overlap;
      } else {
        throw new Error('Invalid tile overlap (0 to 8192) ' + tile.overlap);
      }
    }
    // Container
    if (isDefined(tile.container)) {
      if (isString(tile.container) && contains(tile.container, ['fs', 'zip'])) {
        this.options.tileContainer = tile.container;
      } else {
        throw new Error('Invalid tile container ' + tile.container);
      }
    }
    // Layout
    if (isDefined(tile.layout)) {
      if (isString(tile.layout) && contains(tile.layout, ['dz', 'google', 'zoomify'])) {
        this.options.tileLayout = tile.layout;
      } else {
        throw new Error('Invalid tile layout ' + tile.layout);
      }
    }
  }
  return this;
};

/*
  Extend edges
*/
Sharp.prototype.extend = function(extend) {
  if (isInteger(extend) && extend > 0) {
    this.options.extendTop = extend;
    this.options.extendBottom = extend;
    this.options.extendLeft = extend;
    this.options.extendRight = extend;
  } else if (
    isObject(extend) &&
    isInteger(extend.top) && extend.top >= 0 &&
    isInteger(extend.bottom) && extend.bottom >= 0 &&
    isInteger(extend.left) && extend.left >= 0 &&
    isInteger(extend.right) && extend.right >= 0
  ) {
    this.options.extendTop = extend.top;
    this.options.extendBottom = extend.bottom;
    this.options.extendLeft = extend.left;
    this.options.extendRight = extend.right;
  } else {
    throw new Error('Invalid edge extension ' + extend);
  }
  return this;
};

// Kernels for reduction
module.exports.kernel = {
  cubic: 'cubic',
  lanczos2: 'lanczos2',
  lanczos3: 'lanczos3'
};
// Interpolators for enlargement
module.exports.interpolator = {
  nearest: 'nearest',
  bilinear: 'bilinear',
  bicubic: 'bicubic',
  nohalo: 'nohalo',
  lbb: 'lbb',
  locallyBoundedBicubic: 'lbb',
  vsqbs: 'vsqbs',
  vertexSplitQuadraticBasisSpline: 'vsqbs'
};

/*
  Resize image to width x height pixels
  options.kernel is the kernel to use for reductions, default 'lanczos3'
  options.interpolator is the interpolator to use for enlargements, default 'bicubic'
*/
Sharp.prototype.resize = function(width, height, options) {
  if (isDefined(width)) {
    if (isInteger(width) && inRange(width, 1, maximum.width)) {
      this.options.width = width;
    } else {
      throw new Error('Invalid width (1 to ' + maximum.width + ') ' + width);
    }
  } else {
    this.options.width = -1;
  }
  if (isDefined(height)) {
    if (isInteger(height) && inRange(height, 1, maximum.height)) {
      this.options.height = height;
    } else {
      throw new Error('Invalid height (1 to ' + maximum.height + ') ' + height);
    }
  } else {
    this.options.height = -1;
  }
  if (isObject(options)) {
    // Kernel
    if (isDefined(options.kernel)) {
      if (isString(module.exports.kernel[options.kernel])) {
        this.options.kernel = module.exports.kernel[options.kernel];
      } else {
        throw new Error('Invalid kernel ' + options.kernel);
      }
    }
    // Interpolator
    if (isDefined(options.interpolator)) {
      if (isString(module.exports.interpolator[options.interpolator])) {
        this.options.interpolator = module.exports.interpolator[options.interpolator];
      } else {
        throw new Error('Invalid interpolator ' + options.interpolator);
      }
    }
  }
  return this;
};
Sharp.prototype.interpolateWith = util.deprecate(function(interpolator) {
  return this.resize(
    this.options.width > 0 ? this.options.width : null,
    this.options.height > 0 ? this.options.height : null,
    { interpolator: interpolator }
  );
}, 'interpolateWith: Please use resize(w, h, { interpolator: ... }) instead');

/*
  Limit the total number of pixels for input images
  Assumes the image dimensions contained in the file header can be trusted.
  Alternatively can use boolean to disable or reset to default (maximum pixels)
*/
Sharp.prototype.limitInputPixels = function(limit) {
  //if we pass in false we represent the integer as 0 to disable
  if(limit === false) {
    limit = 0;
  } else if(limit === true) {
    limit = maximum.pixels;
  }
  if (typeof limit === 'number' && !Number.isNaN(limit) && limit % 1 === 0 && limit >= 0) {
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
        that._flattenBufferIn();
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
        that._flattenBufferIn();
        sharp.pipeline(that.options, function(err, data, info) {
          if (err) {
            that.emit('error', err);
          } else {
            that.emit('info', info);
            that.push(data);
          }
          that.push(null);
        });
      });
    } else {
      // output=stream, input=file/buffer
      sharp.pipeline(this.options, function(err, data, info) {
        if (err) {
          that.emit('error', err);
        } else {
          that.emit('info', info);
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
          that._flattenBufferIn();
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
        that._flattenBufferIn();
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
          that._flattenBufferIn();
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
  var that = this;
  // Clone existing options
  var clone = new Sharp();
  util._extend(clone.options, this.options);
  // Pass 'finish' event to clone for Stream-based input
  this.on('finish', function() {
    // Clone inherits input data
    that._flattenBufferIn();
    clone.options.bufferIn = that.options.bufferIn;
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
