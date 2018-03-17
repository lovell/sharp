'use strict';

const is = require('./is');

/**
 * Rotate the output image by either an explicit angle
 * or auto-orient based on the EXIF `Orientation` tag.
 *
 * If an angle is provided, it is converted to a valid 90/180/270deg rotation.
 * For example, `-450` will produce a 270deg rotation.
 *
 * If no angle is provided, it is determined from the EXIF data.
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
 * @param {Number} [angle=auto] angle of rotation, must be a multiple of 90.
 * @returns {Sharp}
 * @throws {Error} Invalid parameters
 */
function rotate (angle) {
  if (!is.defined(angle)) {
    this.options.useExifOrientation = true;
  } else if (is.integer(angle) && !(angle % 90)) {
    this.options.angle = angle;
  } else {
    throw new Error('Unsupported angle: angle must be a positive/negative multiple of 90 ' + angle);
  }
  return this;
}

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
function extract (options) {
  const suffix = this.options.width === -1 && this.options.height === -1 ? 'Pre' : 'Post';
  ['left', 'top', 'width', 'height'].forEach(function (name) {
    const value = options[name];
    if (is.integer(value) && value >= 0) {
      this.options[name + (name === 'left' || name === 'top' ? 'Offset' : '') + suffix] = value;
    } else {
      throw new Error('Non-integer value for ' + name + ' of ' + value);
    }
  }, this);
  // Ensure existing rotation occurs before pre-resize extraction
  if (suffix === 'Pre' && ((this.options.angle % 360) !== 0 || this.options.useExifOrientation === true)) {
    this.options.rotateBeforePreExtract = true;
  }
  return this;
}

/**
 * Flip the image about the vertical Y axis. This always occurs after rotation, if any.
 * The use of `flip` implies the removal of the EXIF `Orientation` tag, if any.
 * @param {Boolean} [flip=true]
 * @returns {Sharp}
 */
function flip (flip) {
  this.options.flip = is.bool(flip) ? flip : true;
  return this;
}

/**
 * Flop the image about the horizontal X axis. This always occurs after rotation, if any.
 * The use of `flop` implies the removal of the EXIF `Orientation` tag, if any.
 * @param {Boolean} [flop=true]
 * @returns {Sharp}
 */
function flop (flop) {
  this.options.flop = is.bool(flop) ? flop : true;
  return this;
}

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
function sharpen (sigma, flat, jagged) {
  if (!is.defined(sigma)) {
    // No arguments: default to mild sharpen
    this.options.sharpenSigma = -1;
  } else if (is.bool(sigma)) {
    // Boolean argument: apply mild sharpen?
    this.options.sharpenSigma = sigma ? -1 : 0;
  } else if (is.number(sigma) && is.inRange(sigma, 0.01, 10000)) {
    // Numeric argument: specific sigma
    this.options.sharpenSigma = sigma;
    // Control over flat areas
    if (is.defined(flat)) {
      if (is.number(flat) && is.inRange(flat, 0, 10000)) {
        this.options.sharpenFlat = flat;
      } else {
        throw new Error('Invalid sharpen level for flat areas (0.0 - 10000.0) ' + flat);
      }
    }
    // Control over jagged areas
    if (is.defined(jagged)) {
      if (is.number(jagged) && is.inRange(jagged, 0, 10000)) {
        this.options.sharpenJagged = jagged;
      } else {
        throw new Error('Invalid sharpen level for jagged areas (0.0 - 10000.0) ' + jagged);
      }
    }
  } else {
    throw new Error('Invalid sharpen sigma (0.01 - 10000) ' + sigma);
  }
  return this;
}

/**
 * Apply median filter.
 * When used without parameters the default window is 3x3.
 * @param {Number} [size=3] square mask size: size x size
 * @returns {Sharp}
 * @throws {Error} Invalid parameters
 */
function median (size) {
  if (!is.defined(size)) {
    // No arguments: default to 3x3
    this.options.medianSize = 3;
  } else if (is.integer(size) && is.inRange(size, 1, 1000)) {
    // Numeric argument: specific sigma
    this.options.medianSize = size;
  } else {
    throw new Error('Invalid median size ' + size);
  }
  return this;
}

/**
 * Blur the image.
 * When used without parameters, performs a fast, mild blur of the output image.
 * When a `sigma` is provided, performs a slower, more accurate Gaussian blur.
 * @param {Number} [sigma] a value between 0.3 and 1000 representing the sigma of the Gaussian mask, where `sigma = 1 + radius / 2`.
 * @returns {Sharp}
 * @throws {Error} Invalid parameters
 */
function blur (sigma) {
  if (!is.defined(sigma)) {
    // No arguments: default to mild blur
    this.options.blurSigma = -1;
  } else if (is.bool(sigma)) {
    // Boolean argument: apply mild blur?
    this.options.blurSigma = sigma ? -1 : 0;
  } else if (is.number(sigma) && is.inRange(sigma, 0.3, 1000)) {
    // Numeric argument: specific sigma
    this.options.blurSigma = sigma;
  } else {
    throw new Error('Invalid blur sigma (0.3 - 1000.0) ' + sigma);
  }
  return this;
}

/**
 * Extends/pads the edges of the image with the colour provided to the `background` method.
 * This operation will always occur after resizing and extraction, if any.
 *
 * @example
 * // Resize to 140 pixels wide, then add 10 transparent pixels
 * // to the top, left and right edges and 20 to the bottom edge
 * sharp(input)
 *   .resize(140)
 *   .background({r: 0, g: 0, b: 0, alpha: 0})
 *   .extend({top: 10, bottom: 20, left: 10, right: 10})
 *   ...
 *
 * @param {(Number|Object)} extend - single pixel count to add to all edges or an Object with per-edge counts
 * @param {Number} [extend.top]
 * @param {Number} [extend.left]
 * @param {Number} [extend.bottom]
 * @param {Number} [extend.right]
 * @returns {Sharp}
 * @throws {Error} Invalid parameters
*/
function extend (extend) {
  if (is.integer(extend) && extend > 0) {
    this.options.extendTop = extend;
    this.options.extendBottom = extend;
    this.options.extendLeft = extend;
    this.options.extendRight = extend;
  } else if (
    is.object(extend) &&
    is.integer(extend.top) && extend.top >= 0 &&
    is.integer(extend.bottom) && extend.bottom >= 0 &&
    is.integer(extend.left) && extend.left >= 0 &&
    is.integer(extend.right) && extend.right >= 0
  ) {
    this.options.extendTop = extend.top;
    this.options.extendBottom = extend.bottom;
    this.options.extendLeft = extend.left;
    this.options.extendRight = extend.right;
  } else {
    throw new Error('Invalid edge extension ' + extend);
  }
  return this;
}

/**
 * Merge alpha transparency channel, if any, with `background`.
 * @param {Boolean} [flatten=true]
 * @returns {Sharp}
 */
function flatten (flatten) {
  this.options.flatten = is.bool(flatten) ? flatten : true;
  return this;
}

/**
 * Trim "boring" pixels from all edges that contain values within a percentage similarity of the top-left pixel.
 * @param {Number} [tolerance=10] value between 1 and 99 representing the percentage similarity.
 * @returns {Sharp}
 * @throws {Error} Invalid parameters
 */
function trim (tolerance) {
  if (!is.defined(tolerance)) {
    this.options.trimTolerance = 10;
  } else if (is.integer(tolerance) && is.inRange(tolerance, 1, 99)) {
    this.options.trimTolerance = tolerance;
  } else {
    throw new Error('Invalid trim tolerance (1 to 99) ' + tolerance);
  }
  return this;
}

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
function gamma (gamma) {
  if (!is.defined(gamma)) {
    // Default gamma correction of 2.2 (sRGB)
    this.options.gamma = 2.2;
  } else if (is.number(gamma) && is.inRange(gamma, 1, 3)) {
    this.options.gamma = gamma;
  } else {
    throw new Error('Invalid gamma correction (1.0 to 3.0) ' + gamma);
  }
  return this;
}

/**
 * Produce the "negative" of the image.
 * @param {Boolean} [negate=true]
 * @returns {Sharp}
 */
function negate (negate) {
  this.options.negate = is.bool(negate) ? negate : true;
  return this;
}

/**
 * Enhance output image contrast by stretching its luminance to cover the full dynamic range.
 * @param {Boolean} [normalise=true]
 * @returns {Sharp}
 */
function normalise (normalise) {
  this.options.normalise = is.bool(normalise) ? normalise : true;
  return this;
}

/**
 * Alternative spelling of normalise.
 * @param {Boolean} [normalize=true]
 * @returns {Sharp}
 */
function normalize (normalize) {
  return this.normalise(normalize);
}

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
 * @param {Array<Number>} kernel.kernel - Array of length `width*height` containing the kernel values.
 * @param {Number} [kernel.scale=sum] - the scale of the kernel in pixels.
 * @param {Number} [kernel.offset=0] - the offset of the kernel in pixels.
 * @returns {Sharp}
 * @throws {Error} Invalid parameters
 */
function convolve (kernel) {
  if (!is.object(kernel) || !Array.isArray(kernel.kernel) ||
      !is.integer(kernel.width) || !is.integer(kernel.height) ||
      !is.inRange(kernel.width, 3, 1001) || !is.inRange(kernel.height, 3, 1001) ||
      kernel.height * kernel.width !== kernel.kernel.length
  ) {
    // must pass in a kernel
    throw new Error('Invalid convolution kernel');
  }
  // Default scale is sum of kernel values
  if (!is.integer(kernel.scale)) {
    kernel.scale = kernel.kernel.reduce(function (a, b) {
      return a + b;
    }, 0);
  }
  // Clip scale to a minimum value of 1
  if (kernel.scale < 1) {
    kernel.scale = 1;
  }
  if (!is.integer(kernel.offset)) {
    kernel.offset = 0;
  }
  this.options.convKernel = kernel;
  return this;
}

/**
 * Any pixel value greather than or equal to the threshold value will be set to 255, otherwise it will be set to 0.
 * @param {Number} [threshold=128] - a value in the range 0-255 representing the level at which the threshold will be applied.
 * @param {Object} [options]
 * @param {Boolean} [options.greyscale=true] - convert to single channel greyscale.
 * @param {Boolean} [options.grayscale=true] - alternative spelling for greyscale.
 * @returns {Sharp}
 * @throws {Error} Invalid parameters
 */
function threshold (threshold, options) {
  if (!is.defined(threshold)) {
    this.options.threshold = 128;
  } else if (is.bool(threshold)) {
    this.options.threshold = threshold ? 128 : 0;
  } else if (is.integer(threshold) && is.inRange(threshold, 0, 255)) {
    this.options.threshold = threshold;
  } else {
    throw new Error('Invalid threshold (0 to 255) ' + threshold);
  }
  if (!is.object(options) || options.greyscale === true || options.grayscale === true) {
    this.options.thresholdGrayscale = true;
  } else {
    this.options.thresholdGrayscale = false;
  }
  return this;
}

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
function boolean (operand, operator, options) {
  this.options.boolean = this._createInputDescriptor(operand, options);
  if (is.string(operator) && is.inArray(operator, ['and', 'or', 'eor'])) {
    this.options.booleanOp = operator;
  } else {
    throw new Error('Invalid boolean operator ' + operator);
  }
  return this;
}

/**
 * Apply the linear formula a * input + b to the image (levels adjustment)
 * @param {Number} [a=1.0] multiplier
 * @param {Number} [b=0.0] offset
 * @returns {Sharp}
 * @throws {Error} Invalid parameters
 */
function linear (a, b) {
  if (!is.defined(a)) {
    this.options.linearA = 1.0;
  } else if (is.number(a)) {
    this.options.linearA = a;
  } else {
    throw new Error('Invalid linear transform multiplier ' + a);
  }

  if (!is.defined(b)) {
    this.options.linearB = 0.0;
  } else if (is.number(b)) {
    this.options.linearB = b;
  } else {
    throw new Error('Invalid linear transform offset ' + b);
  }

  return this;
}

/**
 * Decorate the Sharp prototype with operation-related functions.
 * @private
 */
module.exports = function (Sharp) {
  [
    rotate,
    extract,
    flip,
    flop,
    sharpen,
    median,
    blur,
    extend,
    flatten,
    trim,
    gamma,
    negate,
    normalise,
    normalize,
    convolve,
    threshold,
    boolean,
    linear
  ].forEach(function (f) {
    Sharp.prototype[f.name] = f;
  });
};
