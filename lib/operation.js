'use strict';

const { flatten: flattenArray } = require('array-flatten');
const color = require('color');
const is = require('./is');

/**
 * Rotate the output image by either an explicit angle
 * or auto-orient based on the EXIF `Orientation` tag.
 *
 * If an angle is provided, it is converted to a valid positive degree rotation.
 * For example, `-450` will produce a 270deg rotation.
 *
 * When rotating by an angle other than a multiple of 90,
 * the background colour can be provided with the `background` option.
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
 * @param {number} [angle=auto] angle of rotation.
 * @param {Object} [options] - if present, is an Object with optional attributes.
 * @param {string|Object} [options.background="#000000"] parsed by the [color](https://www.npmjs.org/package/color) module to extract values for red, green, blue and alpha.
 * @returns {Sharp}
 * @throws {Error} Invalid parameters
 */
function rotate (angle, options) {
  if (!is.defined(angle)) {
    this.options.useExifOrientation = true;
  } else if (is.integer(angle) && !(angle % 90)) {
    this.options.angle = angle;
  } else if (is.number(angle)) {
    this.options.rotationAngle = angle;
    if (is.object(options) && options.background) {
      const backgroundColour = color(options.background);
      this.options.rotationBackground = [
        backgroundColour.red(),
        backgroundColour.green(),
        backgroundColour.blue(),
        Math.round(backgroundColour.alpha() * 255)
      ];
    }
  } else {
    throw is.invalidParameterError('angle', 'numeric', angle);
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
 * Perform an affine transform on an image. This operation will always occur after resizing, extraction and rotation, if any.
 *
 * You must provide an array of length 4 or a 2x2 affine transformation matrix.
 * By default, new pixels are filled with a black background. You can provide a background color with the `background` option.
 * A particular interpolator may also be specified. Set the `interpolator` option to an attribute of the `sharp.interpolator` Object e.g. `sharp.interpolator.nohalo`.
 *
 * In the case of a 2x2 matrix, the transform is:
 * - X = `matrix[0, 0]` \* (x + `idx`) + `matrix[0, 1]` \* (y + `idy`) + `odx`
 * - Y = `matrix[1, 0]` \* (x + `idx`) + `matrix[1, 1]` \* (y + `idy`) + `ody`
 *
 * where:
 * - x and y are the coordinates in input image.
 * - X and Y are the coordinates in output image.
 * - (0,0) is the upper left corner.
 *
 * @since 0.27.0
 *
 * @example
 * const pipeline = sharp()
 *   .affine([[1, 0.3], [0.1, 0.7]], {
 *      background: 'white',
 *      interpolate: sharp.interpolators.nohalo
 *   })
 *   .toBuffer((err, outputBuffer, info) => {
 *      // outputBuffer contains the transformed image
 *      // info.width and info.height contain the new dimensions
 *   });
 *
 * inputStream
 *   .pipe(pipeline);
 *
 * @param {Array<Array<number>>|Array<number>} matrix - affine transformation matrix
 * @param {Object} [options] - if present, is an Object with optional attributes.
 * @param {String|Object} [options.background="#000000"] - parsed by the [color](https://www.npmjs.org/package/color) module to extract values for red, green, blue and alpha.
 * @param {Number} [options.idx=0] - input horizontal offset
 * @param {Number} [options.idy=0] - input vertical offset
 * @param {Number} [options.odx=0] - output horizontal offset
 * @param {Number} [options.ody=0] - output vertical offset
 * @param {String} [options.interpolator=sharp.interpolators.bicubic] - interpolator
 * @returns {Sharp}
 * @throws {Error} Invalid parameters
 */
function affine (matrix, options) {
  const flatMatrix = flattenArray(matrix);
  if (flatMatrix.length === 4 && flatMatrix.every(is.number)) {
    this.options.affineMatrix = flatMatrix;
  } else {
    throw is.invalidParameterError('matrix', '1x4 or 2x2 array', matrix);
  }

  if (is.defined(options)) {
    if (is.object(options)) {
      this._setBackgroundColourOption('affineBackground', options.background);
      if (is.defined(options.idx)) {
        if (is.number(options.idx)) {
          this.options.affineIdx = options.idx;
        } else {
          throw is.invalidParameterError('options.idx', 'number', options.idx);
        }
      }
      if (is.defined(options.idy)) {
        if (is.number(options.idy)) {
          this.options.affineIdy = options.idy;
        } else {
          throw is.invalidParameterError('options.idy', 'number', options.idy);
        }
      }
      if (is.defined(options.odx)) {
        if (is.number(options.odx)) {
          this.options.affineOdx = options.odx;
        } else {
          throw is.invalidParameterError('options.odx', 'number', options.odx);
        }
      }
      if (is.defined(options.ody)) {
        if (is.number(options.ody)) {
          this.options.affineOdy = options.ody;
        } else {
          throw is.invalidParameterError('options.ody', 'number', options.ody);
        }
      }
      if (is.defined(options.interpolator)) {
        if (is.inArray(options.interpolator, Object.values(this.constructor.interpolators))) {
          this.options.affineInterpolator = options.interpolator;
        } else {
          throw is.invalidParameterError('options.interpolator', 'valid interpolator name', options.interpolator);
        }
      }
    } else {
      throw is.invalidParameterError('options', 'object', options);
    }
  }

  return this;
}

/**
 * Sharpen the image.
 * When used without parameters, performs a fast, mild sharpen of the output image.
 * When a `sigma` is provided, performs a slower, more accurate sharpen of the L channel in the LAB colour space.
 * Separate control over the level of sharpening in "flat" and "jagged" areas is available.
 *
 * @param {number} [sigma] - the sigma of the Gaussian mask, where `sigma = 1 + radius / 2`.
 * @param {number} [flat=1.0] - the level of sharpening to apply to "flat" areas.
 * @param {number} [jagged=2.0] - the level of sharpening to apply to "jagged" areas.
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
        throw is.invalidParameterError('flat', 'number between 0 and 10000', flat);
      }
    }
    // Control over jagged areas
    if (is.defined(jagged)) {
      if (is.number(jagged) && is.inRange(jagged, 0, 10000)) {
        this.options.sharpenJagged = jagged;
      } else {
        throw is.invalidParameterError('jagged', 'number between 0 and 10000', jagged);
      }
    }
  } else {
    throw is.invalidParameterError('sigma', 'number between 0.01 and 10000', sigma);
  }
  return this;
}

/**
 * Apply median filter.
 * When used without parameters the default window is 3x3.
 * @param {number} [size=3] square mask size: size x size
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
    throw is.invalidParameterError('size', 'integer between 1 and 1000', size);
  }
  return this;
}

/**
 * Blur the image.
 * When used without parameters, performs a fast, mild blur of the output image.
 * When a `sigma` is provided, performs a slower, more accurate Gaussian blur.
 * @param {number} [sigma] a value between 0.3 and 1000 representing the sigma of the Gaussian mask, where `sigma = 1 + radius / 2`.
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
    throw is.invalidParameterError('sigma', 'number between 0.3 and 1000', sigma);
  }
  return this;
}

/**
 * Merge alpha transparency channel, if any, with a background.
 * @param {Object} [options]
 * @param {string|Object} [options.background={r: 0, g: 0, b: 0}] - background colour, parsed by the [color](https://www.npmjs.org/package/color) module, defaults to black.
 * @returns {Sharp}
 */
function flatten (options) {
  this.options.flatten = is.bool(options) ? options : true;
  if (is.object(options)) {
    this._setBackgroundColourOption('flattenBackground', options.background);
  }
  return this;
}

/**
 * Apply a gamma correction by reducing the encoding (darken) pre-resize at a factor of `1/gamma`
 * then increasing the encoding (brighten) post-resize at a factor of `gamma`.
 * This can improve the perceived brightness of a resized image in non-linear colour spaces.
 * JPEG and WebP input images will not take advantage of the shrink-on-load performance optimisation
 * when applying a gamma correction.
 *
 * Supply a second argument to use a different output gamma value, otherwise the first value is used in both cases.
 *
 * @param {number} [gamma=2.2] value between 1.0 and 3.0.
 * @param {number} [gammaOut] value between 1.0 and 3.0. (optional, defaults to same as `gamma`)
 * @returns {Sharp}
 * @throws {Error} Invalid parameters
 */
function gamma (gamma, gammaOut) {
  if (!is.defined(gamma)) {
    // Default gamma correction of 2.2 (sRGB)
    this.options.gamma = 2.2;
  } else if (is.number(gamma) && is.inRange(gamma, 1, 3)) {
    this.options.gamma = gamma;
  } else {
    throw is.invalidParameterError('gamma', 'number between 1.0 and 3.0', gamma);
  }
  if (!is.defined(gammaOut)) {
    // Default gamma correction for output is same as input
    this.options.gammaOut = this.options.gamma;
  } else if (is.number(gammaOut) && is.inRange(gammaOut, 1, 3)) {
    this.options.gammaOut = gammaOut;
  } else {
    throw is.invalidParameterError('gammaOut', 'number between 1.0 and 3.0', gammaOut);
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
 * @param {number} kernel.width - width of the kernel in pixels.
 * @param {number} kernel.height - width of the kernel in pixels.
 * @param {Array<number>} kernel.kernel - Array of length `width*height` containing the kernel values.
 * @param {number} [kernel.scale=sum] - the scale of the kernel in pixels.
 * @param {number} [kernel.offset=0] - the offset of the kernel in pixels.
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
 * @param {number} [threshold=128] - a value in the range 0-255 representing the level at which the threshold will be applied.
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
    throw is.invalidParameterError('threshold', 'integer between 0 and 255', threshold);
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
 * @param {Buffer|string} operand - Buffer containing image data or string containing the path to an image file.
 * @param {string} operator - one of `and`, `or` or `eor` to perform that bitwise operation, like the C logic operators `&`, `|` and `^` respectively.
 * @param {Object} [options]
 * @param {Object} [options.raw] - describes operand when using raw pixel data.
 * @param {number} [options.raw.width]
 * @param {number} [options.raw.height]
 * @param {number} [options.raw.channels]
 * @returns {Sharp}
 * @throws {Error} Invalid parameters
 */
function boolean (operand, operator, options) {
  this.options.boolean = this._createInputDescriptor(operand, options);
  if (is.string(operator) && is.inArray(operator, ['and', 'or', 'eor'])) {
    this.options.booleanOp = operator;
  } else {
    throw is.invalidParameterError('operator', 'one of: and, or, eor', operator);
  }
  return this;
}

/**
 * Apply the linear formula a * input + b to the image (levels adjustment)
 * @param {number} [a=1.0] multiplier
 * @param {number} [b=0.0] offset
 * @returns {Sharp}
 * @throws {Error} Invalid parameters
 */
function linear (a, b) {
  if (!is.defined(a)) {
    this.options.linearA = 1.0;
  } else if (is.number(a)) {
    this.options.linearA = a;
  } else {
    throw is.invalidParameterError('a', 'numeric', a);
  }
  if (!is.defined(b)) {
    this.options.linearB = 0.0;
  } else if (is.number(b)) {
    this.options.linearB = b;
  } else {
    throw is.invalidParameterError('b', 'numeric', b);
  }
  return this;
}

/**
 * Recomb the image with the specified matrix.
 *
 * @since 0.21.1
 *
 * @example
 * sharp(input)
 *   .recomb([
 *    [0.3588, 0.7044, 0.1368],
 *    [0.2990, 0.5870, 0.1140],
 *    [0.2392, 0.4696, 0.0912],
 *   ])
 *   .raw()
 *   .toBuffer(function(err, data, info) {
 *     // data contains the raw pixel data after applying the recomb
 *     // With this example input, a sepia filter has been applied
 *   });
 *
 * @param {Array<Array<number>>} inputMatrix - 3x3 Recombination matrix
 * @returns {Sharp}
 * @throws {Error} Invalid parameters
 */
function recomb (inputMatrix) {
  if (!Array.isArray(inputMatrix) || inputMatrix.length !== 3 ||
      inputMatrix[0].length !== 3 ||
      inputMatrix[1].length !== 3 ||
      inputMatrix[2].length !== 3
  ) {
    // must pass in a kernel
    throw new Error('Invalid recombination matrix');
  }
  this.options.recombMatrix = [
    inputMatrix[0][0], inputMatrix[0][1], inputMatrix[0][2],
    inputMatrix[1][0], inputMatrix[1][1], inputMatrix[1][2],
    inputMatrix[2][0], inputMatrix[2][1], inputMatrix[2][2]
  ].map(Number);
  return this;
}

/**
 * Transforms the image using brightness, saturation and hue rotation.
 *
 * @since 0.22.1
 *
 * @example
 * sharp(input)
 *   .modulate({
 *     brightness: 2 // increase lightness by a factor of 2
 *   });
 *
 * sharp(input)
 *   .modulate({
 *     hue: 180 // hue-rotate by 180 degrees
 *   });
 *
 * // decreate brightness and saturation while also hue-rotating by 90 degrees
 * sharp(input)
 *   .modulate({
 *     brightness: 0.5,
 *     saturation: 0.5,
 *     hue: 90
 *   });
 *
 * @param {Object} [options]
 * @param {number} [options.brightness] Brightness multiplier
 * @param {number} [options.saturation] Saturation multiplier
 * @param {number} [options.hue] Degrees for hue rotation
 * @returns {Sharp}
 */
function modulate (options) {
  if (!is.plainObject(options)) {
    throw is.invalidParameterError('options', 'plain object', options);
  }
  if ('brightness' in options) {
    if (is.number(options.brightness) && options.brightness >= 0) {
      this.options.brightness = options.brightness;
    } else {
      throw is.invalidParameterError('brightness', 'number above zero', options.brightness);
    }
  }
  if ('saturation' in options) {
    if (is.number(options.saturation) && options.saturation >= 0) {
      this.options.saturation = options.saturation;
    } else {
      throw is.invalidParameterError('saturation', 'number above zero', options.saturation);
    }
  }
  if ('hue' in options) {
    if (is.integer(options.hue)) {
      this.options.hue = options.hue % 360;
    } else {
      throw is.invalidParameterError('hue', 'number', options.hue);
    }
  }
  return this;
}

/**
 * Decorate the Sharp prototype with operation-related functions.
 * @private
 */
module.exports = function (Sharp) {
  Object.assign(Sharp.prototype, {
    rotate,
    flip,
    flop,
    affine,
    sharpen,
    median,
    blur,
    flatten,
    gamma,
    negate,
    normalise,
    normalize,
    convolve,
    threshold,
    boolean,
    linear,
    recomb,
    modulate
  });
};
