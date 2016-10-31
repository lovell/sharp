'use strict';

const path = require('path');
const util = require('util');
const stream = require('stream');
const events = require('events');

const semver = require('semver');
const color = require('color');

const sharp = require('./build/Release/sharp.node');

// Versioning
let versions = {
  vips: sharp.libvipsVersion()
};
(function () {
  // Does libvips meet minimum requirement?
  const libvipsVersionMin = require('./package.json').config.libvips;
  if (semver.lt(versions.vips, libvipsVersionMin)) {
    throw new Error('Found libvips ' + versions.vips + ' but require at least ' + libvipsVersionMin);
  }
  // Include versions of dependencies, if present
  try {
    versions = require('./lib/versions.json');
  } catch (err) {}
})();

// Limits
const maximum = {
  width: 0x3FFF,
  height: 0x3FFF,
  pixels: Math.pow(0x3FFF, 2)
};

/**
 * Constructor factory to which further methods are chained.
 *
 * JPEG, PNG or WebP format image data can be streamed out from this object.
 * When using Stream based output, derived attributes are available from the `info` event.
 *
 * @example
 * sharp('input.jpg')
 *   .resize(300, 200)
 *   .toFile('output.jpg', function(err) {
 *     // output.jpg is a 300 pixels wide and 200 pixels high image
 *     // containing a scaled and cropped version of input.jpg
 *   });
 *
 * @example
 * // Read image data from readableStream,
 * // resize to 300 pixels wide,
 * // emit an 'info' event with calculated dimensions
 * // and finally write image data to writableStream
 * var transformer = sharp()
 *   .resize(300)
 *   .on('info', function(info) {
 *     console.log('Image height is ' + info.height);
 *   });
 * readableStream.pipe(transformer).pipe(writableStream);
 *
 * @param {Buffer|String} [input] - if present, can be
 *  a Buffer containing JPEG, PNG, WebP, GIF, SVG, TIFF or raw pixel image data, or
 *  a String containing the path to an JPEG, PNG, WebP, GIF, SVG or TIFF image file.
 * JPEG, PNG, WebP, GIF, SVG, TIFF or raw pixel image data can be streamed into the object when null or undefined.
 *
 * @param {Object} [options] - if present, is an Object with optional attributes.
 * @param {Number} [options.density=72] - integral number representing the DPI for vector images.
 * @param {Object} [options.raw] - describes raw pixel image data. See `raw()` for pixel ordering.
 * @param {Number} [options.raw.width]
 * @param {Number} [options.raw.height]
 * @param {Number} [options.raw.channels]
 * @returns {Sharp} - Implements the [stream.Duplex](http://nodejs.org/api/stream.html#stream_class_stream_duplex) class.
 * @throws {Error} Invalid parameters
 */
const Sharp = function (input, options) {
  if (!(this instanceof Sharp)) {
    return new Sharp(input, options);
  }
  stream.Duplex.call(this);
  this.options = {
    // input options
    sequentialRead: false,
    limitInputPixels: maximum.pixels,
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
    thresholdGrayscale: true,
    trimTolerance: 0,
    gamma: 0,
    greyscale: false,
    normalize: 0,
    booleanBufferIn: null,
    booleanFileIn: '',
    joinChannelIn: [],
    extractChannel: -1,
    colourspace: 'srgb',
    // overlay
    overlayGravity: 0,
    overlayXOffset: -1,
    overlayYOffset: -1,
    overlayTile: false,
    overlayCutout: false,
    // output
    fileOut: '',
    formatOut: 'input',
    streamOut: false,
    withMetadata: false,
    withMetadataOrientation: -1,
    // output format
    jpegQuality: 80,
    jpegProgressive: false,
    jpegChromaSubsampling: '4:2:0',
    jpegTrellisQuantisation: false,
    jpegOvershootDeringing: false,
    jpegOptimiseScans: false,
    pngProgressive: false,
    pngCompressionLevel: 6,
    pngAdaptiveFiltering: true,
    webpQuality: 80,
    tiffQuality: 80,
    tileSize: 256,
    tileOverlap: 0,
    // Function to notify of queue length changes
    queueListener: function (queueLength) {
      module.exports.queue.emit('change', queueLength);
    }
  };
  this.options.input = this._createInputDescriptor(input, options, { allowStream: true });
  return this;
};
module.exports = Sharp;
util.inherits(Sharp, stream.Duplex);

/**
 * An EventEmitter that emits a `change` event when a task is either:
 * - queued, waiting for _libuv_ to provide a worker thread
 * - complete
 * @member
 * @example
 * sharp.queue.on('change', function(queueLength) {
 *   console.log('Queue contains ' + queueLength + ' task(s)');
 * });
 */
module.exports.queue = new events.EventEmitter();

/**
 * An Object containing nested boolean values representing the available input and output formats/methods.
 * @example
 * console.log(sharp.format());
 * @returns {Object}
 */
module.exports.format = sharp.format();

/**
 * An Object containing the version numbers of libvips and its dependencies.
 * @member
 * @example
 * console.log(sharp.versions);
 */
module.exports.versions = versions;

// Validation helpers
const isDefined = function (val) {
  return typeof val !== 'undefined' && val !== null;
};
const isObject = function (val) {
  return typeof val === 'object';
};
const isFunction = function (val) {
  return typeof val === 'function';
};
const isBoolean = function (val) {
  return typeof val === 'boolean';
};
const isBuffer = function (val) {
  return typeof val === 'object' && val instanceof Buffer;
};
const isString = function (val) {
  return typeof val === 'string' && val.length > 0;
};
const isNumber = function (val) {
  return typeof val === 'number' && !Number.isNaN(val);
};
const isInteger = function (val) {
  return isNumber(val) && val % 1 === 0;
};
const inRange = function (val, min, max) {
  return val >= min && val <= max;
};
const contains = function (val, list) {
  return list.indexOf(val) !== -1;
};

// Create Object containing input and input-related options
Sharp.prototype._createInputDescriptor = function (input, inputOptions, containerOptions) {
  const inputDescriptor = {};
  if (isString(input)) {
    // filesystem
    inputDescriptor.file = input;
  } else if (isBuffer(input)) {
    // Buffer
    inputDescriptor.buffer = input;
  } else if (!isDefined(input) && isObject(containerOptions) && containerOptions.allowStream) {
    // Stream
    inputDescriptor.buffer = [];
  } else {
    throw new Error('Unsupported input ' + typeof input);
  }
  if (isObject(inputOptions)) {
    // Density
    if (isDefined(inputOptions.density)) {
      if (isInteger(inputOptions.density) && inRange(inputOptions.density, 1, 2400)) {
        inputDescriptor.density = inputOptions.density;
      } else {
        throw new Error('Invalid density (1 to 2400) ' + inputOptions.density);
      }
    }
    // Raw pixel input
    if (isDefined(inputOptions.raw)) {
      if (
        isObject(inputOptions.raw) &&
        isInteger(inputOptions.raw.width) && inRange(inputOptions.raw.width, 1, maximum.width) &&
        isInteger(inputOptions.raw.height) && inRange(inputOptions.raw.height, 1, maximum.height) &&
        isInteger(inputOptions.raw.channels) && inRange(inputOptions.raw.channels, 1, 4)
      ) {
        inputDescriptor.rawWidth = inputOptions.raw.width;
        inputDescriptor.rawHeight = inputOptions.raw.height;
        inputDescriptor.rawChannels = inputOptions.raw.channels;
      } else {
        throw new Error('Expected width, height and channels for raw pixel input');
      }
    }
  } else if (isDefined(inputOptions)) {
    throw new Error('Invalid input options ' + inputOptions);
  }
  return inputDescriptor;
};

/**
 * Handle incoming Buffer chunk on Writable Stream.
 * @param {Buffer} chunk
 * @param {String} encoding - unused
 * @param {Function} callback
 */
Sharp.prototype._write = function (chunk, encoding, callback) {
  if (Array.isArray(this.options.input.buffer)) {
    if (isBuffer(chunk)) {
      this.options.input.buffer.push(chunk);
      callback();
    } else {
      callback(new Error('Non-Buffer data on Writable Stream'));
    }
  } else {
    callback(new Error('Unexpected data on Writable Stream'));
  }
};

// Flattens the array of chunks accumulated in input.buffer
Sharp.prototype._flattenBufferIn = function () {
  if (this._isStreamInput()) {
    this.options.input.buffer = Buffer.concat(this.options.input.buffer);
  }
};
Sharp.prototype._isStreamInput = function () {
  return Array.isArray(this.options.input.buffer);
};

/**
 * Weighting to apply to image crop.
 * @member
 */
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

/**
 * Strategies for automagic crop behaviour.
 * @member
 */
module.exports.strategy = {
  entropy: 16,
  attention: 17
};

/**
 * Crop the resized image to the exact size specified, the default behaviour.
 *
 * Possible attributes of the optional `sharp.gravity` are `north`, `northeast`, `east`, `southeast`, `south`,
 * `southwest`, `west`, `northwest`, `center` and `centre`.
 *
 * The experimental strategy-based approach resizes so one dimension is at its target length
 * then repeatedly ranks edge regions, discarding the edge with the lowest score based on the selected strategy.
 * - `entropy`: focus on the region with the highest [Shannon entropy](https://en.wikipedia.org/wiki/Entropy_%28information_theory%29).
 * - `attention`: focus on the region with the highest luminance frequency, colour saturation and presence of skin tones.
 *
 * @example
 * const transformer = sharp()
 *   .resize(200, 200)
 *   .crop(sharp.strategy.entropy)
 *   .on('error', function(err) {
 *     console.log(err);
 *   });
 * // Read image data from readableStream
 * // Write 200px square auto-cropped image data to writableStream
 * readableStream.pipe(transformer).pipe(writableStream);
 *
 * @param {String} [crop='centre'] - A member of `sharp.gravity` to crop to an edge/corner or `sharp.strategy` to crop dynamically.
 * @returns {Sharp}
 * @throws {Error} Invalid parameters
 */
Sharp.prototype.crop = function (crop) {
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
  } else if (isInteger(crop) && crop >= module.exports.strategy.entropy) {
    // Strategy
    this.options.crop = crop;
  } else {
    throw new Error('Unsupported crop ' + crop);
  }
  return this;
};

/**
 * Extract a region of the image.
 *
 * - Use `extract` before `resize` for pre-resize extraction.
 * - Use `extract` after `resize` for post-resize extraction.
 * - Use `extract` before and after for both.
 *
 * @example
 * sharp(input)
 *   .extract({ left: left, top: top, width: width, height: height })
 *   .toFile(output, function(err) {
 *     // Extract a region of the input image, saving in the same format.
 *   });
 * @example
 * sharp(input)
 *   .extract({ left: leftOffsetPre, top: topOffsetPre, width: widthPre, height: heightPre })
 *   .resize(width, height)
 *   .extract({ left: leftOffsetPost, top: topOffsetPost, width: widthPost, height: heightPost })
 *   .toFile(output, function(err) {
 *     // Extract a region, resize, then extract from the resized image
 *   });
 *
 * @param {Object} options
 * @param {Number} options.left - zero-indexed offset from left edge
 * @param {Number} options.top - zero-indexed offset from top edge
 * @param {Number} options.width - dimension of extracted image
 * @param {Number} options.height - dimension of extracted image
 * @returns {Sharp}
 * @throws {Error} Invalid parameters
 */
Sharp.prototype.extract = function (options) {
  const suffix = this.options.width === -1 && this.options.height === -1 ? 'Pre' : 'Post';
  ['left', 'top', 'width', 'height'].forEach(function (name) {
    const value = options[name];
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

/**
 * Extract a single channel from a multi-channel image.
 *
 * @example
 * sharp(input)
 *   .extractChannel('green')
 *   .toFile('input_green.jpg', function(err, info) {
 *     // info.channels === 1
 *     // input_green.jpg contains the green channel of the input image
 *    });
 *
 * @param {Number|String} channel - zero-indexed band number to extract, or `red`, `green` or `blue` as alternative to `0`, `1` or `2` respectively.
 * @returns {Sharp}
 * @throws {Error} Invalid channel
 */
Sharp.prototype.extractChannel = function (channel) {
  if (channel === 'red') {
    channel = 0;
  } else if (channel === 'green') {
    channel = 1;
  } else if (channel === 'blue') {
    channel = 2;
  }
  if (isInteger(channel) && inRange(channel, 0, 4)) {
    this.options.extractChannel = channel;
  } else {
    throw new Error('Cannot extract invalid channel ' + channel);
  }
  return this;
};

/**
 * Set the background for the `embed`, `flatten` and `extend` operations.
 * The default background is `{r: 0, g: 0, b: 0, a: 1}`, black without transparency.
 *
 * Delegates to the _color_ module, which can throw an Error
 * but is liberal in what it accepts, clipping values to sensible min/max.
 * The alpha value is a float between `0` (transparent) and `1` (opaque).
 *
 * @param {String|Object} rgba - parsed by the [color](https://www.npmjs.org/package/color) module to extract values for red, green, blue and alpha.
 * @returns {Sharp}
 * @throws {Error} Invalid parameter
 */
Sharp.prototype.background = function (rgba) {
  const colour = color(rgba);
  this.options.background = colour.rgbArray();
  this.options.background.push(colour.alpha() * 255);
  return this;
};

/**
 * Preserving aspect ratio, resize the image to the maximum `width` or `height` specified
 * then embed on a background of the exact `width` and `height` specified.
 *
 * If the background contains an alpha value then WebP and PNG format output images will
 * contain an alpha channel, even when the input image does not.
 *
 * @example
 * sharp('input.gif')
 *   .resize(200, 300)
 *   .background({r: 0, g: 0, b: 0, a: 0})
 *   .embed()
 *   .toFormat(sharp.format.webp)
 *   .toBuffer(function(err, outputBuffer) {
 *     if (err) {
 *       throw err;
 *     }
 *     // outputBuffer contains WebP image data of a 200 pixels wide and 300 pixels high
 *     // containing a scaled version, embedded on a transparent canvas, of input.gif
 *   });
 *
 * @returns {Sharp}
 */
Sharp.prototype.embed = function () {
  this.options.canvas = 'embed';
  return this;
};

/**
 * Preserving aspect ratio, resize the image to be as large as possible
 * while ensuring its dimensions are less than or equal to the `width` and `height` specified.
 *
 * Both `width` and `height` must be provided via `resize` otherwise the behaviour will default to `crop`.
 *
 * @example
 * sharp(inputBuffer)
 *   .resize(200, 200)
 *   .max()
 *   .toFormat('jpeg')
 *   .toBuffer()
 *   .then(function(outputBuffer) {
 *     // outputBuffer contains JPEG image data no wider than 200 pixels and no higher
 *     // than 200 pixels regardless of the inputBuffer image dimensions
 *   });
 *
 * @returns {Sharp}
 */
Sharp.prototype.max = function () {
  this.options.canvas = 'max';
  return this;
};

/**
 * Preserving aspect ratio, resize the image to be as small as possible
 * while ensuring its dimensions are greater than or equal to the `width` and `height` specified.
 *
 * Both `width` and `height` must be provided via `resize` otherwise the behaviour will default to `crop`.
 *
 * @returns {Sharp}
 */
Sharp.prototype.min = function () {
  this.options.canvas = 'min';
  return this;
};

/**
 * Ignoring the aspect ratio of the input, stretch the image to
 * the exact `width` and/or `height` provided via `resize`.
 * @returns {Sharp}
 */
Sharp.prototype.ignoreAspectRatio = function () {
  this.options.canvas = 'ignore_aspect';
  return this;
};

/**
 * Merge alpha transparency channel, if any, with `background`.
 * @param {Boolean} [flatten=true]
 * @returns {Sharp}
 */
Sharp.prototype.flatten = function (flatten) {
  this.options.flatten = isBoolean(flatten) ? flatten : true;
  return this;
};

/**
 * Produce the "negative" of the image.
 * White => Black, Black => White, Blue => Yellow, etc.
 * @param {Boolean} [negate=true]
 * @returns {Sharp}
 */
Sharp.prototype.negate = function (negate) {
  this.options.negate = isBoolean(negate) ? negate : true;
  return this;
};

/**
 * Perform a bitwise boolean operation with operand image.
 *
 * This operation creates an output image where each pixel is the result of
 * the selected bitwise boolean `operation` between the corresponding pixels of the input images.
 *
 * @param {Buffer|String} operand - Buffer containing image data or String containing the path to an image file.
 * @param {String} operator - one of `and`, `or` or `eor` to perform that bitwise operation, like the C logic operators `&`, `|` and `^` respectively.
 * @param {Object} [options]
 * @param {Object} [options.raw] - describes operand when using raw pixel data.
 * @param {Number} [options.raw.width]
 * @param {Number} [options.raw.height]
 * @param {Number} [options.raw.channels]
 * @returns {Sharp}
 * @throws {Error} Invalid parameters
 */
Sharp.prototype.boolean = function (operand, operator, options) {
  this.options.boolean = this._createInputDescriptor(operand, options);
  if (isString(operator) && contains(operator, ['and', 'or', 'eor'])) {
    this.options.booleanOp = operator;
  } else {
    throw new Error('Invalid boolean operator ' + operator);
  }
  return this;
};

/**
 * Overlay (composite) an image over the processed (resized, extracted etc.) image.
 *
 * The overlay image must be the same size or smaller than the processed image.
 * If both `top` and `left` options are provided, they take precedence over `gravity`.
 *
 * @example
 * sharp('input.png')
 *   .rotate(180)
 *   .resize(300)
 *   .flatten()
 *   .background('#ff6600')
 *   .overlayWith('overlay.png', { gravity: sharp.gravity.southeast } )
 *   .sharpen()
 *   .withMetadata()
 *   .quality(90)
 *   .webp()
 *   .toBuffer()
 *   .then(function(outputBuffer) {
 *     // outputBuffer contains upside down, 300px wide, alpha channel flattened
 *     // onto orange background, composited with overlay.png with SE gravity,
 *     // sharpened, with metadata, 90% quality WebP image data. Phew!
 *   });
 *
 * @param {Buffer|String} overlay - Buffer containing image data or String containing the path to an image file.
 * @param {Object} [options]
 * @param {String} [options.gravity='centre'] - gravity at which to place the overlay.
 * @param {Number} [options.top] - the pixel offset from the top edge.
 * @param {Number} [options.left] - the pixel offset from the left edge.
 * @param {Boolean} [options.tile=false] - set to true to repeat the overlay image across the entire image with the given `gravity`.
 * @param {Boolean} [options.cutout=false] - set to true to apply only the alpha channel of the overlay image to the input image, giving the appearance of one image being cut out of another.
 * @param {Object} [options.raw] - describes overlay when using raw pixel data.
 * @param {Number} [options.raw.width]
 * @param {Number} [options.raw.height]
 * @param {Number} [options.raw.channels]
 * @returns {Sharp}
 * @throws {Error} Invalid parameters
 */
Sharp.prototype.overlayWith = function (overlay, options) {
  this.options.overlay = this._createInputDescriptor(overlay, options, {
    allowStream: false
  });
  if (isObject(options)) {
    if (isDefined(options.tile)) {
      if (isBoolean(options.tile)) {
        this.options.overlayTile = options.tile;
      } else {
        throw new Error('Invalid overlay tile ' + options.tile);
      }
    }
    if (isDefined(options.cutout)) {
      if (isBoolean(options.cutout)) {
        this.options.overlayCutout = options.cutout;
      } else {
        throw new Error('Invalid overlay cutout ' + options.cutout);
      }
    }
    if (isDefined(options.left) || isDefined(options.top)) {
      if (
        isInteger(options.left) && inRange(options.left, 0, maximum.width) &&
        isInteger(options.top) && inRange(options.top, 0, maximum.height)
      ) {
        this.options.overlayXOffset = options.left;
        this.options.overlayYOffset = options.top;
      } else {
        throw new Error('Invalid overlay left ' + options.left + ' and/or top ' + options.top);
      }
    }
    if (isDefined(options.gravity)) {
      if (isInteger(options.gravity) && inRange(options.gravity, 0, 8)) {
        this.options.overlayGravity = options.gravity;
      } else if (isString(options.gravity) && isInteger(module.exports.gravity[options.gravity])) {
        this.options.overlayGravity = module.exports.gravity[options.gravity];
      } else {
        throw new Error('Unsupported overlay gravity ' + options.gravity);
      }
    }
  }
  return this;
};

/**
 * Join one or more channels to the image.
 * The meaning of the added channels depends on the output colourspace, set with `toColourspace()`.
 * By default the output image will be web-friendly sRGB, with additional channels interpreted as alpha channels.
 * Channel ordering follows vips convention:
 * - sRGB: 0: Red, 1: Green, 2: Blue, 3: Alpha.
 * - CMYK: 0: Magenta, 1: Cyan, 2: Yellow, 3: Black, 4: Alpha.
 *
 * Buffers may be any of the image formats supported by sharp: JPEG, PNG, WebP, GIF, SVG, TIFF or raw pixel image data.
 * For raw pixel input, the `options` object should contain a `raw` attribute, which follows the format of the attribute of the same name in the `sharp()` constructor.
 *
 * @param {Array|String|Buffer} images - one or more images (file paths, Buffers).
 * @param {Object} - image options, see `sharp()` constructor.
 * @returns {Sharp}
 * @throws {Error} Invalid parameters
 */
Sharp.prototype.joinChannel = function (images, options) {
  if (Array.isArray(images)) {
    images.forEach(function (image) {
      this.options.joinChannelIn.push(this._createInputDescriptor(image, options));
    }, this);
  } else {
    this.options.joinChannelIn.push(this._createInputDescriptor(images, options));
  }
  return this;
};

/**
 * Rotate the output image by either an explicit angle
 * or auto-orient based on the EXIF `Orientation` tag.
 *
 * Use this method without angle to determine the angle from EXIF data.
 * Mirroring is supported and may infer the use of a flip operation.
 *
 * The use of `rotate` implies the removal of the EXIF `Orientation` tag, if any.
 *
 * Method order is important when both rotating and extracting regions,
 * for example `rotate(x).extract(y)` will produce a different result to `extract(y).rotate(x)`.
 *
 * @example
 * const pipeline = sharp()
 *   .rotate()
 *   .resize(null, 200)
 *   .toBuffer(function (err, outputBuffer, info) {
 *     // outputBuffer contains 200px high JPEG image data,
 *     // auto-rotated using EXIF Orientation tag
 *     // info.width and info.height contain the dimensions of the resized image
 *   });
 * readableStream.pipe(pipeline);
 *
 * @param {Number} [angle=auto] 0, 90, 180 or 270.
 * @returns {Sharp}
 * @throws {Error} Invalid parameters
 */
Sharp.prototype.rotate = function (angle) {
  if (!isDefined(angle)) {
    this.options.angle = -1;
  } else if (isInteger(angle) && contains(angle, [0, 90, 180, 270])) {
    this.options.angle = angle;
  } else {
    throw new Error('Unsupported angle (0, 90, 180, 270) ' + angle);
  }
  return this;
};

/**
 * Flip the image about the vertical Y axis. This always occurs after rotation, if any.
 * The use of `flip` implies the removal of the EXIF `Orientation` tag, if any.
 * @param {Boolean} [flip=true]
 * @returns {Sharp}
 */
Sharp.prototype.flip = function (flip) {
  this.options.flip = isBoolean(flip) ? flip : true;
  return this;
};

/**
 * Flop the image about the horizontal X axis. This always occurs after rotation, if any.
 * The use of `flop` implies the removal of the EXIF `Orientation` tag, if any.
 * @param {Boolean} [flop=true]
 * @returns {Sharp}
 */
Sharp.prototype.flop = function (flop) {
  this.options.flop = isBoolean(flop) ? flop : true;
  return this;
};

/**
 * Do not enlarge the output image if the input image width *or* height are already less than the required dimensions.
 * This is equivalent to GraphicsMagick's `>` geometry option:
 * "*change the dimensions of the image only if its width or height exceeds the geometry specification*".
 * @param {Boolean} [withoutEnlargement=true]
 * @returns {Sharp}
*/
Sharp.prototype.withoutEnlargement = function (withoutEnlargement) {
  this.options.withoutEnlargement = isBoolean(withoutEnlargement) ? withoutEnlargement : true;
  return this;
};

/**
 * Blur the image.
 * When used without parameters, performs a fast, mild blur of the output image.
 * When a `sigma` is provided, performs a slower, more accurate Gaussian blur.
 * @param {Number} [sigma] a value between 0.3 and 1000 representing the sigma of the Gaussian mask, where `sigma = 1 + radius / 2`.
 * @returns {Sharp}
 * @throws {Error} Invalid parameters
 */
Sharp.prototype.blur = function (sigma) {
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

/**
 * Convolve the image with the specified kernel.
 *
 * @example
 * sharp(input)
 *   .convolve({
 *     width: 3,
 *     height: 3,
 *     kernel: [-1, 0, 1, -2, 0, 2, -1, 0, 1]
 *   })
 *   .raw()
 *   .toBuffer(function(err, data, info) {
 *     // data contains the raw pixel data representing the convolution
 *     // of the input image with the horizontal Sobel operator
 *   });
 *
 * @param {Object} kernel
 * @param {Number} kernel.width - width of the kernel in pixels.
 * @param {Number} kernel.height - width of the kernel in pixels.
 * @param {Array} kernel.kernel - Array of length `width*height` containing the kernel values.
 * @param {Number} [kernel.scale=sum] - the scale of the kernel in pixels.
 * @param {Number} [kernel.offset=0] - the offset of the kernel in pixels.
 * @returns {Sharp}
 * @throws {Error} Invalid parameters
 */
Sharp.prototype.convolve = function (kernel) {
  if (!isObject(kernel) || !Array.isArray(kernel.kernel) ||
      !isInteger(kernel.width) || !isInteger(kernel.height) ||
      !inRange(kernel.width, 3, 1001) || !inRange(kernel.height, 3, 1001) ||
      kernel.height * kernel.width !== kernel.kernel.length
     ) {
    // must pass in a kernel
    throw new Error('Invalid convolution kernel');
  }
  // Default scale is sum of kernel values
  if (!isInteger(kernel.scale)) {
    kernel.scale = kernel.kernel.reduce(function (a, b) {
      return a + b;
    }, 0);
  }
  // Clip scale to a minimum value of 1
  if (kernel.scale < 1) {
    kernel.scale = 1;
  }
  if (!isInteger(kernel.offset)) {
    kernel.offset = 0;
  }
  this.options.convKernel = kernel;
  return this;
};

/**
 * Sharpen the image.
 * When used without parameters, performs a fast, mild sharpen of the output image.
 * When a `sigma` is provided, performs a slower, more accurate sharpen of the L channel in the LAB colour space.
 * Separate control over the level of sharpening in "flat" and "jagged" areas is available.
 *
 * @param {Number} [sigma] - the sigma of the Gaussian mask, where `sigma = 1 + radius / 2`.
 * @param {Number} [flat=1.0] - the level of sharpening to apply to "flat" areas.
 * @param {Number} [jagged=2.0] - the level of sharpening to apply to "jagged" areas.
 * @returns {Sharp}
 * @throws {Error} Invalid parameters
 */
Sharp.prototype.sharpen = function (sigma, flat, jagged) {
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

/**
 * Any pixel value greather than or equal to the threshold value will be set to 255, otherwise it will be set to 0.
 * @param {Number} [threshold=128] - a value in the range 0-255 representing the level at which the threshold will be applied.
 * @param {Object} [options]
 * @param {Boolean} [options.greyscale=true] - convert to single channel greyscale.
 * @param {Boolean} [options.grayscale=true] - alternative spelling for greyscale.
 * @returns {Sharp}
 * @throws {Error} Invalid parameters
 */
Sharp.prototype.threshold = function (threshold, options) {
  if (!isDefined(threshold)) {
    this.options.threshold = 128;
  } else if (isBoolean(threshold)) {
    this.options.threshold = threshold ? 128 : 0;
  } else if (isInteger(threshold) && inRange(threshold, 0, 255)) {
    this.options.threshold = threshold;
  } else {
    throw new Error('Invalid threshold (0 to 255) ' + threshold);
  }
  if (!isObject(options) || options.greyscale === true || options.grayscale === true) {
    this.options.thresholdGrayscale = true;
  } else {
    this.options.thresholdGrayscale = false;
  }
  return this;
};

/**
 * Trim "boring" pixels from all edges that contain values within a percentage similarity of the top-left pixel.
 * @param {Number} [tolerance=10] value between 1 and 99 representing the percentage similarity.
 * @returns {Sharp}
 * @throws {Error} Invalid parameters
 */
Sharp.prototype.trim = function (tolerance) {
  if (!isDefined(tolerance)) {
    this.options.trimTolerance = 10;
  } else if (isInteger(tolerance) && inRange(tolerance, 1, 99)) {
    this.options.trimTolerance = tolerance;
  } else {
    throw new Error('Invalid trim tolerance (1 to 99) ' + tolerance);
  }
  return this;
};

/**
 * Apply a gamma correction by reducing the encoding (darken) pre-resize at a factor of `1/gamma`
 * then increasing the encoding (brighten) post-resize at a factor of `gamma`.
 * This can improve the perceived brightness of a resized image in non-linear colour spaces.
 * JPEG and WebP input images will not take advantage of the shrink-on-load performance optimisation
 * when applying a gamma correction.
 * @param {Number} [gamma=2.2] value between 1.0 and 3.0.
 * @returns {Sharp}
 * @throws {Error} Invalid parameters
 */
Sharp.prototype.gamma = function (gamma) {
  if (!isDefined(gamma)) {
    // Default gamma correction of 2.2 (sRGB)
    this.options.gamma = 2.2;
  } else if (isNumber(gamma) && inRange(gamma, 1, 3)) {
    this.options.gamma = gamma;
  } else {
    throw new Error('Invalid gamma correction (1.0 to 3.0) ' + gamma);
  }
  return this;
};

/**
 * Enhance output image contrast by stretching its luminance to cover the full dynamic range.
 * @param {Boolean} [normalize=true]
 * @returns {Sharp}
 */
Sharp.prototype.normalize = function (normalize) {
  this.options.normalize = isBoolean(normalize) ? normalize : true;
  return this;
};
/**
 * Alternative spelling of normalize.
 * @param {Boolean} [normalise=true]
 * @returns {Sharp}
 */
Sharp.prototype.normalise = Sharp.prototype.normalize;

/**
 * Perform a bitwise boolean operation on all input image channels (bands) to produce a single channel output image.
 *
 * @example
 * sharp('3-channel-rgb-input.png')
 *   .bandbool(sharp.bool.and)
 *   .toFile('1-channel-output.png', function (err, info) {
 *     // The output will be a single channel image where each pixel `P = R & G & B`.
 *     // If `I(1,1) = [247, 170, 14] = [0b11110111, 0b10101010, 0b00001111]`
 *     // then `O(1,1) = 0b11110111 & 0b10101010 & 0b00001111 = 0b00000010 = 2`.
 *   });
 *
 * @param {String} boolOp - one of `and`, `or` or `eor` to perform that bitwise operation, like the C logic operators `&`, `|` and `^` respectively.
 * @returns {Sharp}
 * @throws {Error} Invalid parameters
 */
Sharp.prototype.bandbool = function (boolOp) {
  if (isString(boolOp) && contains(boolOp, ['and', 'or', 'eor'])) {
    this.options.bandBoolOp = boolOp;
  } else {
    throw new Error('Invalid bandbool operation ' + boolOp);
  }
  return this;
};

/**
 * Convert to 8-bit greyscale; 256 shades of grey.
 * This is a linear operation. If the input image is in a non-linear colour space such as sRGB, use `gamma()` with `greyscale()` for the best results.
 * By default the output image will be web-friendly sRGB and contain three (identical) color channels.
 * This may be overridden by other sharp operations such as `toColourspace('b-w')`,
 * which will produce an output image containing one color channel.
 * An alpha channel may be present, and will be unchanged by the operation.
 * @param {Boolean} [greyscale=true]
 * @returns {Sharp}
 */
Sharp.prototype.greyscale = function (greyscale) {
  this.options.greyscale = isBoolean(greyscale) ? greyscale : true;
  return this;
};
/**
 * Alternative spelling of `greyscale`.
 * @param {Boolean} [grayscale=true]
 * @returns {Sharp}
 */
Sharp.prototype.grayscale = Sharp.prototype.greyscale;

/**
 * Set the output colourspace.
 * By default output image will be web-friendly sRGB, with additional channels interpreted as alpha channels.
 * @param {String} [colourspace] - output colourspace e.g. `srgb`, `rgb`, `cmyk`, `lab`, `b-w` [...](https://github.com/jcupitt/libvips/blob/master/libvips/iofuncs/enumtypes.c#L568)
 * @returns {Sharp}
 * @throws {Error} Invalid parameters
 */
Sharp.prototype.toColourspace = function (colourspace) {
  if (!isString(colourspace)) {
    throw new Error('Invalid output colourspace ' + colourspace);
  }
  this.options.colourspace = colourspace;
  return this;
};
/**
 * Alternative spelling of `toColourspace`.
 * @param {String} [colorspace] - output colorspace.
 * @returns {Sharp}
 * @throws {Error} Invalid parameters
 */
Sharp.prototype.toColorspace = Sharp.prototype.toColourspace;

/**
 * An advanced setting that switches the libvips access method to `VIPS_ACCESS_SEQUENTIAL`.
 * This will reduce memory usage and can improve performance on some systems.
 * @param {Boolean} [sequentialRead=true]
 * @returns {Sharp}
 */
Sharp.prototype.sequentialRead = function (sequentialRead) {
  this.options.sequentialRead = isBoolean(sequentialRead) ? sequentialRead : true;
  return this;
};

// Deprecated output options
Sharp.prototype.quality = util.deprecate(function (quality) {
  const formatOut = this.options.formatOut;
  const options = { quality: quality };
  this.jpeg(options).webp(options).tiff(options);
  this.options.formatOut = formatOut;
  return this;
}, 'quality: use jpeg({ quality: ... }), webp({ quality: ... }) and/or tiff({ quality: ... }) instead');
Sharp.prototype.progressive = util.deprecate(function (progressive) {
  const formatOut = this.options.formatOut;
  const options = { progressive: (progressive !== false) };
  this.jpeg(options).png(options);
  this.options.formatOut = formatOut;
  return this;
}, 'progressive: use jpeg({ progressive: ... }) and/or png({ progressive: ... }) instead');
Sharp.prototype.compressionLevel = util.deprecate(function (compressionLevel) {
  const formatOut = this.options.formatOut;
  this.png({ compressionLevel: compressionLevel });
  this.options.formatOut = formatOut;
  return this;
}, 'compressionLevel: use png({ compressionLevel: ... }) instead');
Sharp.prototype.withoutAdaptiveFiltering = util.deprecate(function (withoutAdaptiveFiltering) {
  const formatOut = this.options.formatOut;
  this.png({ adaptiveFiltering: (withoutAdaptiveFiltering === false) });
  this.options.formatOut = formatOut;
  return this;
}, 'withoutAdaptiveFiltering: use png({ adaptiveFiltering: ... }) instead');
Sharp.prototype.withoutChromaSubsampling = util.deprecate(function (withoutChromaSubsampling) {
  const formatOut = this.options.formatOut;
  this.jpeg({ chromaSubsampling: (withoutChromaSubsampling === false) ? '4:2:0' : '4:4:4' });
  this.options.formatOut = formatOut;
  return this;
}, 'withoutChromaSubsampling: use jpeg({ chromaSubsampling: "4:4:4" }) instead');
Sharp.prototype.trellisQuantisation = util.deprecate(function (trellisQuantisation) {
  const formatOut = this.options.formatOut;
  this.jpeg({ trellisQuantisation: (trellisQuantisation !== false) });
  this.options.formatOut = formatOut;
  return this;
}, 'trellisQuantisation: use jpeg({ trellisQuantisation: ... }) instead');
Sharp.prototype.trellisQuantization = Sharp.prototype.trellisQuantisation;
Sharp.prototype.overshootDeringing = util.deprecate(function (overshootDeringing) {
  const formatOut = this.options.formatOut;
  this.jpeg({ overshootDeringing: (overshootDeringing !== false) });
  this.options.formatOut = formatOut;
  return this;
}, 'overshootDeringing: use jpeg({ overshootDeringing: ... }) instead');
Sharp.prototype.optimiseScans = util.deprecate(function (optimiseScans) {
  const formatOut = this.options.formatOut;
  this.jpeg({ optimiseScans: (optimiseScans !== false) });
  this.options.formatOut = formatOut;
  return this;
}, 'optimiseScans: use jpeg({ optimiseScans: ... }) instead');
Sharp.prototype.optimizeScans = Sharp.prototype.optimiseScans;

/**
 * Include all metadata (EXIF, XMP, IPTC) from the input image in the output image.
 * The default behaviour, when `withMetadata` is not used, is to strip all metadata and convert to the device-independent sRGB colour space.
 * This will also convert to and add a web-friendly sRGB ICC profile.
 * @param {Object} [withMetadata]
 * @param {Number} [withMetadata.orientation] value between 1 and 8, used to update the EXIF `Orientation` tag.
 * @returns {Sharp}
 * @throws {Error} Invalid parameters
 */
Sharp.prototype.withMetadata = function (withMetadata) {
  this.options.withMetadata = isBoolean(withMetadata) ? withMetadata : true;
  if (isObject(withMetadata)) {
    if (isDefined(withMetadata.orientation)) {
      if (isInteger(withMetadata.orientation) && inRange(withMetadata.orientation, 1, 8)) {
        this.options.withMetadataOrientation = withMetadata.orientation;
      } else {
        throw new Error('Invalid orientation (1 to 8) ' + withMetadata.orientation);
      }
    }
  }
  return this;
};

/**
 * Use tile-based deep zoom (image pyramid) output.
 * You can also use a `.zip` or `.szi` file extension with `toFile` to write to a compressed archive file format.
 *
 * @example
 *  sharp('input.tiff')
 *   .tile({
 *     size: 512
 *   })
 *   .toFile('output.dzi', function(err, info) {
 *     // output.dzi is the Deep Zoom XML definition
 *     // output_files contains 512x512 tiles grouped by zoom level
 *   });
 *
 * @param {Object} [tile]
 * @param {Number} [tile.size=256] tile size in pixels, a value between 1 and 8192.
 * @param {Number} [tile.overlap=0] tile overlap in pixels, a value between 0 and 8192.
 * @param {String} [tile.container='fs'] tile container, with value `fs` (filesystem) or `zip` (compressed file).
 * @param {String} [tile.layout='dz'] filesystem layout, possible values are `dz`, `zoomify` or `google`.
 * @returns {Sharp}
 * @throws {Error} Invalid parameters
 */
Sharp.prototype.tile = function (tile) {
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

/**
 * Extends/pads the edges of the image with the colour provided to the `background` method.
 * This operation will always occur after resizing and extraction, if any.
 *
 * @example
 * // Resize to 140 pixels wide, then add 10 transparent pixels
 * // to the top, left and right edges and 20 to the bottom edge
 * sharp(input)
 *   .resize(140)
 *   .background({r: 0, g: 0, b: 0, a: 0})
 *   .extend({top: 10, bottom: 20, left: 10, right: 10})
 *   ...
 *
 * @param {Number|Object} extend - single pixel count to add to all edges or an Object with per-edge counts
 * @param {Number} [extend.top]
 * @param {Number} [extend.left]
 * @param {Number} [extend.bottom]
 * @param {Number} [extend.right]
 * @returns {Sharp}
 * @throws {Error} Invalid parameters
*/
Sharp.prototype.extend = function (extend) {
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

/**
 * Reduction kernels.
 * @member
 */
module.exports.kernel = {
  cubic: 'cubic',
  lanczos2: 'lanczos2',
  lanczos3: 'lanczos3'
};
/**
 * Enlargement interpolators.
 * @member
 */
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
/**
 * Boolean operations for bandbool.
 * @member
 */
module.exports.bool = {
  and: 'and',
  or: 'or',
  eor: 'eor'
};
/**
 * Colourspaces.
 * @member
 */
module.exports.colourspace = {
  multiband: 'multiband',
  'b-w': 'b-w',
  bw: 'b-w',
  cmyk: 'cmyk',
  srgb: 'srgb'
};
/**
 * Alternative spelling of colourspace.
 * @member
 */
module.exports.colorspace = module.exports.colourspace;

/**
 * Resize image to `width` x `height`.
 * By default, the resized image is centre cropped to the exact size specified.
 *
 * Possible reduction kernels are:
 * - `cubic`: Use a [Catmull-Rom spline](https://en.wikipedia.org/wiki/Centripetal_Catmull%E2%80%93Rom_spline).
 * - `lanczos2`: Use a [Lanczos kernel](https://en.wikipedia.org/wiki/Lanczos_resampling#Lanczos_kernel) with `a=2`.
 * - `lanczos3`: Use a Lanczos kernel with `a=3` (the default).
 *
 * Possible enlargement interpolators are:
 * - `nearest`: Use [nearest neighbour interpolation](http://en.wikipedia.org/wiki/Nearest-neighbor_interpolation).
 * - `bilinear`: Use [bilinear interpolation](http://en.wikipedia.org/wiki/Bilinear_interpolation), faster than bicubic but with less smooth results.
 * - `vertexSplitQuadraticBasisSpline`: Use the smoother [VSQBS interpolation](https://github.com/jcupitt/libvips/blob/master/libvips/resample/vsqbs.cpp#L48) to prevent "staircasing" when enlarging.
 * - `bicubic`: Use [bicubic interpolation](http://en.wikipedia.org/wiki/Bicubic_interpolation) (the default).
 * - `locallyBoundedBicubic`: Use [LBB interpolation](https://github.com/jcupitt/libvips/blob/master/libvips/resample/lbb.cpp#L100), which prevents some "[acutance](http://en.wikipedia.org/wiki/Acutance)" but typically reduces performance by a factor of 2.
 * - `nohalo`: Use [Nohalo interpolation](http://eprints.soton.ac.uk/268086/), which prevents acutance but typically reduces performance by a factor of 3.
 *
 * @example
 * sharp(inputBuffer)
 *   .resize(200, 300, {
 *     kernel: sharp.kernel.lanczos2,
 *     interpolator: sharp.interpolator.nohalo
 *   })
 *   .background('white')
 *   .embed()
 *   .toFile('output.tiff')
 *   .then(function() {
 *     // output.tiff is a 200 pixels wide and 300 pixels high image
 *     // containing a lanczos2/nohalo scaled version, embedded on a white canvas,
 *     // of the image data in inputBuffer
 *   });
 *
 * @param {Number} [width] - pixels wide the resultant image should be, between 1 and 16383 (0x3FFF). Use `null` or `undefined` to auto-scale the width to match the height.
 * @param {Number} [height] - pixels high the resultant image should be, between 1 and 16383. Use `null` or `undefined` to auto-scale the height to match the width.
 * @param {Object} [options]
 * @param {String} [options.kernel='lanczos3'] - the kernel to use for image reduction.
 * @param {String} [options.interpolator='bicubic'] - the interpolator to use for image enlargement.
 * @returns {Sharp}
 * @throws {Error} Invalid parameters
 */
Sharp.prototype.resize = function (width, height, options) {
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

/**
 * Do not process input images where the number of pixels (width * height) exceeds this limit.
 * Assumes image dimensions contained in the input metadata can be trusted.
 * The default limit is 268402689 (0x3FFF * 0x3FFF) pixels.
 * @param {Number|Boolean} limit - an integral Number of pixels, zero or false to remove limit, true to use default limit.
 * @returns {Sharp}
 * @throws {Error} Invalid limit
*/
Sharp.prototype.limitInputPixels = function (limit) {
  // if we pass in false we represent the integer as 0 to disable
  if (limit === false) {
    limit = 0;
  } else if (limit === true) {
    limit = maximum.pixels;
  }
  if (isInteger(limit) && limit >= 0) {
    this.options.limitInputPixels = limit;
  } else {
    throw new Error('Invalid pixel limit (0 to ' + maximum.pixels + ') ' + limit);
  }
  return this;
};

/**
 * Write output image data to a file.
 *
 * If an explicit output format is not selected, it will be inferred from the extension,
 * with JPEG, PNG, WebP, TIFF, DZI, and libvips' V format supported.
 * Note that raw pixel data is only supported for buffer output.
 *
 * A Promises/A+ promise is returned when `callback` is not provided.
 *
 * @param {String} fileOut - the path to write the image data to.
 * @param {Function} [callback] - called on completion with two arguments `(err, info)`.
 * `info` contains the output image `format`, `size` (bytes), `width`, `height` and `channels`.
 * @returns {Promise} - when no callback is provided
 * @throws {Error} Invalid parameters
 */
Sharp.prototype.toFile = function (fileOut, callback) {
  if (!fileOut || fileOut.length === 0) {
    const errOutputInvalid = new Error('Invalid output');
    if (isFunction(callback)) {
      callback(errOutputInvalid);
    } else {
      return Promise.reject(errOutputInvalid);
    }
  } else {
    if (this.options.input.file === fileOut) {
      const errOutputIsInput = new Error('Cannot use same file for input and output');
      if (isFunction(callback)) {
        callback(errOutputIsInput);
      } else {
        return Promise.reject(errOutputIsInput);
      }
    } else {
      this.options.fileOut = fileOut;
      return this._pipeline(callback);
    }
  }
  return this;
};

/**
 * Write output to a Buffer.
 * By default, the format will match the input image. JPEG, PNG, WebP, and RAW are supported.
 * `callback`, if present, gets three arguments `(err, buffer, info)` where:
 * - `err` is an error message, if any.
 * - `buffer` is the output image data.
 * - `info` contains the output image `format`, `size` (bytes), `width`, `height` and `channels`.
 * A Promises/A+ promise is returned when `callback` is not provided.
 *
 * @param {Function} [callback]
 * @returns {Promise|Sharp}
 */
Sharp.prototype.toBuffer = function (callback) {
  return this._pipeline(callback);
};

/**
 * Update the output format unless options.force is false,
 * in which case revert to input format.
 * @private
 * @param {String} formatOut
 * @param {Object} [options]
 * @param {Boolean} [options.force=true] - force output format, otherwise attempt to use input format
 * @returns {Sharp}
 */
Sharp.prototype._updateFormatOut = function (formatOut, options) {
  this.options.formatOut = (isObject(options) && options.force === false) ? 'input' : formatOut;
  return this;
};

/**
 * Update a Boolean attribute of the this.options Object.
 * @private
 * @param {String} key
 * @param {Boolean} val
 * @throws {Error} Invalid key
 */
Sharp.prototype._setBooleanOption = function (key, val) {
  if (isBoolean(val)) {
    this.options[key] = val;
  } else {
    throw new Error('Invalid ' + key + ' (boolean) ' + val);
  }
};

/**
 * Use these JPEG options for output image.
 * @param {Object} [options] - output options
 * @param {Number} [options.quality=80] - quality, integer 1-100
 * @param {Boolean} [options.progressive=false] - use progressive (interlace) scan
 * @param {String} [options.chromaSubsampling='4:2:0'] - set to '4:4:4' to prevent chroma subsampling when quality <= 90
 * @param {Boolean} [trellisQuantisation=false] - apply trellis quantisation, requires mozjpeg
 * @param {Boolean} [overshootDeringing=false] - apply overshoot deringing, requires mozjpeg
 * @param {Boolean} [optimiseScans=false] - optimise progressive scans, assumes progressive=true, requires mozjpeg
 * @param {Boolean} [options.force=true] - force JPEG output, otherwise attempt to use input format
 * @returns {Sharp}
 * @throws {Error} Invalid options
 */
Sharp.prototype.jpeg = function (options) {
  if (isObject(options)) {
    if (isDefined(options.quality)) {
      if (isInteger(options.quality) && inRange(options.quality, 1, 100)) {
        this.options.jpegQuality = options.quality;
      } else {
        throw new Error('Invalid quality (integer, 1-100) ' + options.quality);
      }
    }
    if (isDefined(options.progressive)) {
      this._setBooleanOption('jpegProgressive', options.progressive);
    }
    if (isDefined(options.chromaSubsampling)) {
      if (isString(options.chromaSubsampling) && contains(options.chromaSubsampling, ['4:2:0', '4:4:4'])) {
        this.options.jpegChromaSubsampling = options.chromaSubsampling;
      } else {
        throw new Error('Invalid chromaSubsampling (4:2:0, 4:4:4) ' + options.chromaSubsampling);
      }
    }
    options.trellisQuantisation = options.trellisQuantisation || options.trellisQuantization;
    if (isDefined(options.trellisQuantisation)) {
      this._setBooleanOption('jpegTrellisQuantisation', options.trellisQuantisation);
    }
    if (isDefined(options.overshootDeringing)) {
      this._setBooleanOption('jpegOvershootDeringing', options.overshootDeringing);
    }
    options.optimiseScans = options.optimiseScans || options.optimizeScans;
    if (isDefined(options.optimiseScans)) {
      this._setBooleanOption('jpegOptimiseScans', options.optimiseScans);
      if (options.optimiseScans) {
        this.options.jpegProgressive = true;
      }
    }
  }
  return this._updateFormatOut('jpeg', options);
};

/**
 * Use these PNG options for output image.
 * @param {Object} [options]
 * @param {Boolean} [options.progressive=false] - use progressive (interlace) scan
 * @param {Number} [options.compressionLevel=6] - zlib compression level
 * @param {Boolean} [options.adaptiveFiltering=true] - use adaptive row filtering
 * @param {Boolean} [options.force=true] - force PNG output, otherwise attempt to use input format
 * @returns {Sharp}
 * @throws {Error} Invalid options
 */
Sharp.prototype.png = function (options) {
  if (isObject(options)) {
    if (isDefined(options.progressive)) {
      this._setBooleanOption('pngProgressive', options.progressive);
    }
    if (isDefined(options.compressionLevel)) {
      if (isInteger(options.compressionLevel) && inRange(options.compressionLevel, 0, 9)) {
        this.options.pngCompressionLevel = options.compressionLevel;
      } else {
        throw new Error('Invalid compressionLevel (integer, 0-9) ' + options.compressionLevel);
      }
    }
    if (isDefined(options.adaptiveFiltering)) {
      this._setBooleanOption('pngAdaptiveFiltering', options.adaptiveFiltering);
    }
  }
  return this._updateFormatOut('png', options);
};

/**
 * Use these WebP options for output image.
 * @param {Object} [options] - output options
 * @param {Number} [options.quality=80] - quality, integer 1-100
 * @param {Boolean} [options.force=true] - force WebP output, otherwise attempt to use input format
 * @returns {Sharp}
 * @throws {Error} Invalid options
 */
Sharp.prototype.webp = function (options) {
  if (isObject(options)) {
    if (isDefined(options.quality)) {
      if (isInteger(options.quality) && inRange(options.quality, 1, 100)) {
        this.options.webpQuality = options.quality;
      } else {
        throw new Error('Invalid quality (integer, 1-100) ' + options.quality);
      }
    }
  }
  return this._updateFormatOut('webp', options);
};

/**
 * Use these TIFF options for output image.
 * @param {Object} [options] - output options
 * @param {Number} [options.quality=80] - quality, integer 1-100
 * @param {Boolean} [options.force=true] - force TIFF output, otherwise attempt to use input format
 * @returns {Sharp}
 * @throws {Error} Invalid options
 */
Sharp.prototype.tiff = function (options) {
  if (isObject(options)) {
    if (isDefined(options.quality)) {
      if (isInteger(options.quality) && inRange(options.quality, 1, 100)) {
        this.options.tiffQuality = options.quality;
      } else {
        throw new Error('Invalid quality (integer, 1-100) ' + options.quality);
      }
    }
  }
  return this._updateFormatOut('tiff', options);
};

/**
 * Force output to be raw, uncompressed uint8 pixel data.
 * @returns {Sharp}
 */
Sharp.prototype.raw = function () {
  return this._updateFormatOut('raw');
};

/**
 * Force output to a given format.
 * @param {String|Object} format - as a String or an Object with an 'id' attribute
 * @param {Object} options - output options
 * @returns {Sharp}
 * @throws {Error} unsupported format or options
 */
Sharp.prototype.toFormat = function (format, options) {
  if (isObject(format) && isString(format.id)) {
    format = format.id;
  }
  if (!contains(format, ['jpeg', 'png', 'webp', 'tiff', 'raw'])) {
    throw new Error('Unsupported output format ' + format);
  }
  return this[format](options);
};

/**
 * Called by a WriteableStream to notify us it is ready for data.
 * @private
 */
Sharp.prototype._read = function () {
  if (!this.options.streamOut) {
    this.options.streamOut = true;
    this._pipeline();
  }
};

/**
 * Invoke the C++ image processing pipeline
 * Supports callback, stream and promise variants
 * @private
 */
Sharp.prototype._pipeline = function (callback) {
  const that = this;
  if (typeof callback === 'function') {
    // output=file/buffer
    if (this._isStreamInput()) {
      // output=file/buffer, input=stream
      this.on('finish', function () {
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
    if (this._isStreamInput()) {
      // output=stream, input=stream
      this.on('finish', function () {
        that._flattenBufferIn();
        sharp.pipeline(that.options, function (err, data, info) {
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
      sharp.pipeline(this.options, function (err, data, info) {
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
    if (this._isStreamInput()) {
      // output=promise, input=stream
      return new Promise(function (resolve, reject) {
        that.on('finish', function () {
          that._flattenBufferIn();
          sharp.pipeline(that.options, function (err, data) {
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
      return new Promise(function (resolve, reject) {
        sharp.pipeline(that.options, function (err, data) {
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

/**
 * Fast access to image metadata without decoding any compressed image data.
 * A Promises/A+ promise is returned when `callback` is not provided.
 *
 * - `format`: Name of decoder used to decompress image data e.g. `jpeg`, `png`, `webp`, `gif`, `svg`
 * - `width`: Number of pixels wide
 * - `height`: Number of pixels high
 * - `space`: Name of colour space interpretation e.g. `srgb`, `rgb`, `cmyk`, `lab`, `b-w` [...](https://github.com/jcupitt/libvips/blob/master/libvips/iofuncs/enumtypes.c#L568)
 * - `channels`: Number of bands e.g. `3` for sRGB, `4` for CMYK
 * - `density`: Number of pixels per inch (DPI), if present
 * - `hasProfile`: Boolean indicating the presence of an embedded ICC profile
 * - `hasAlpha`: Boolean indicating the presence of an alpha transparency channel
 * - `orientation`: Number value of the EXIF Orientation header, if present
 * - `exif`: Buffer containing raw EXIF data, if present
 * - `icc`: Buffer containing raw [ICC](https://www.npmjs.com/package/icc) profile data, if present
 *
 * @example
 * const image = sharp(inputJpg);
 * image
 *   .metadata()
 *   .then(function(metadata) {
 *     return image
 *       .resize(Math.round(metadata.width / 2))
 *       .webp()
 *       .toBuffer();
 *   })
 *   .then(function(data) {
 *     // data contains a WebP image half the width and height of the original JPEG
 *   });
 *
 * @param {Function} [callback] - called with the arguments `(err, metadata)`
 * @returns {Promise|Sharp}
 */
Sharp.prototype.metadata = function (callback) {
  const that = this;
  if (typeof callback === 'function') {
    if (this._isStreamInput()) {
      this.on('finish', function () {
        that._flattenBufferIn();
        sharp.metadata(that.options, callback);
      });
    } else {
      sharp.metadata(this.options, callback);
    }
    return this;
  } else {
    if (this._isStreamInput()) {
      return new Promise(function (resolve, reject) {
        that.on('finish', function () {
          that._flattenBufferIn();
          sharp.metadata(that.options, function (err, metadata) {
            if (err) {
              reject(err);
            } else {
              resolve(metadata);
            }
          });
        });
      });
    } else {
      return new Promise(function (resolve, reject) {
        sharp.metadata(that.options, function (err, metadata) {
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

/**
 * Take a "snapshot" of the Sharp instance, returning a new instance.
 * Cloned instances inherit the input of their parent instance.
 * This allows multiple output Streams and therefore multiple processing pipelines to share a single input Stream.
 *
 * @example
 * const pipeline = sharp().rotate();
 * pipeline.clone().resize(800, 600).pipe(firstWritableStream);
 * pipeline.clone().extract({ left: 20, top: 20, width: 100, height: 100 }).pipe(secondWritableStream);
 * readableStream.pipe(pipeline);
 * // firstWritableStream receives auto-rotated, resized readableStream
 * // secondWritableStream receives auto-rotated, extracted region of readableStream
 *
 * @returns {Sharp}
 */
Sharp.prototype.clone = function () {
  const that = this;
  // Clone existing options
  const clone = new Sharp();
  util._extend(clone.options, this.options);
  // Pass 'finish' event to clone for Stream-based input
  this.on('finish', function () {
    // Clone inherits input data
    that._flattenBufferIn();
    clone.options.bufferIn = that.options.bufferIn;
    clone.emit('finish');
  });
  return clone;
};

/**
 * Gets, or when options are provided sets, the limits of _libvips'_ operation cache.
 * Existing entries in the cache will be trimmed after any change in limits.
 * This method always returns cache statistics,
 * useful for determining how much working memory is required for a particular task.
 *
 * @example
 * const stats = sharp.cache();
 * @example
 * sharp.cache( { items: 200 } );
 * sharp.cache( { files: 0 } );
 * sharp.cache(false);
 *
 * @param {Object|Boolean} Object with the following attributes, or Boolean where true uses default cache settings and false removes all caching.
 * @param {Number} [options.memory=50] is the maximum memory in MB to use for this cache
 * @param {Number} [options.files=20] is the maximum number of files to hold open
 * @param {Number} [options.items=100] is the maximum number of operations to cache
 * @returns {Object}
 */
module.exports.cache = function (options) {
  if (isBoolean(options)) {
    if (options) {
      // Default cache settings of 50MB, 20 files, 100 items
      return sharp.cache(50, 20, 100);
    } else {
      return sharp.cache(0, 0, 0);
    }
  } else if (isObject(options)) {
    return sharp.cache(options.memory, options.files, options.items);
  } else {
    return sharp.cache();
  }
};
// Ensure default cache settings are set
module.exports.cache(true);

/**
 * Gets, or when a concurrency is provided sets,
 * the number of threads _libvips'_ should create to process each image.
 * The default value is the number of CPU cores.
 * A value of `0` will reset to this default.
 *
 * The maximum number of images that can be processed in parallel
 * is limited by libuv's `UV_THREADPOOL_SIZE` environment variable.
 *
 * This method always returns the current concurrency.
 *
 * @example
 * const threads = sharp.concurrency(); // 4
 * sharp.concurrency(2); // 2
 * sharp.concurrency(0); // 4
 *
 * @param {Number} [concurrency]
 * @returns {Number} concurrency
 */
module.exports.concurrency = function (concurrency) {
  return sharp.concurrency(isInteger(concurrency) ? concurrency : null);
};

/**
 * Provides access to internal task counters.
 * - queue is the number of tasks this module has queued waiting for _libuv_ to provide a worker thread from its pool.
 * - process is the number of resize tasks currently being processed.
 *
 * @example
 * const counters = sharp.counters(); // { queue: 2, process: 4 }
 *
 * @returns {Object}
 */
module.exports.counters = function () {
  return sharp.counters();
};

/**
 * Get and set use of SIMD vector unit instructions.
 * Requires libvips to have been compiled with liborc support.
 *
 * Improves the performance of `resize`, `blur` and `sharpen` operations
 * by taking advantage of the SIMD vector unit of the CPU, e.g. Intel SSE and ARM NEON.
 *
 * This feature is currently off by default but future versions may reverse this.
 * Versions of liborc prior to 0.4.25 are prone to segfault under heavy load.
 *
 * @example
 * const simd = sharp.simd();
 * // simd is `true` if SIMD is currently enabled
 * @example
 * const simd = sharp.simd(true);
 * // attempts to enable the use of SIMD, returning true if available
 *
 * @param {Boolean} [simd=false]
 * @returns {Boolean}
 */
module.exports.simd = function (simd) {
  return sharp.simd(isBoolean(simd) ? simd : null);
};
// Switch off default
module.exports.simd(false);
