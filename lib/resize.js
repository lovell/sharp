'use strict';

const is = require('./is');

/**
 * Weighting to apply to image crop.
 * @member
 * @private
 */
const gravity = {
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
 * @private
 */
const strategy = {
  entropy: 16,
  attention: 17
};

/**
 * Reduction kernels.
 * @member
 * @private
 */
const kernel = {
  cubic: 'cubic',
  lanczos2: 'lanczos2',
  lanczos3: 'lanczos3'
};

/**
 * Enlargement interpolators.
 * @member
 * @private
 */
const interpolator = {
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
 * @param {Boolean} [options.centreSampling=false] - use *magick centre sampling convention instead of corner sampling.
 * @param {Boolean} [options.centerSampling=false] - alternative spelling of centreSampling.
 * @returns {Sharp}
 * @throws {Error} Invalid parameters
 */
const resize = function resize (width, height, options) {
  if (is.defined(width)) {
    if (is.integer(width) && is.inRange(width, 1, this.constructor.maximum.width)) {
      this.options.width = width;
    } else {
      throw is.invalidParameterError('width', `integer between 1 and ${this.constructor.maximum.width}`, width);
    }
  } else {
    this.options.width = -1;
  }
  if (is.defined(height)) {
    if (is.integer(height) && is.inRange(height, 1, this.constructor.maximum.height)) {
      this.options.height = height;
    } else {
      throw is.invalidParameterError('height', `integer between 1 and ${this.constructor.maximum.height}`, height);
    }
  } else {
    this.options.height = -1;
  }
  if (is.object(options)) {
    // Kernel
    if (is.defined(options.kernel)) {
      if (is.string(kernel[options.kernel])) {
        this.options.kernel = kernel[options.kernel];
      } else {
        throw is.invalidParameterError('kernel', 'valid kernel name', options.kernel);
      }
    }
    // Interpolator
    if (is.defined(options.interpolator)) {
      if (is.string(interpolator[options.interpolator])) {
        this.options.interpolator = interpolator[options.interpolator];
      } else {
        throw is.invalidParameterError('interpolator', 'valid interpolator name', options.interpolator);
      }
    }
    // Centre sampling
    options.centreSampling = is.bool(options.centerSampling) ? options.centerSampling : options.centreSampling;
    if (is.defined(options.centreSampling)) {
      this._setBooleanOption('centreSampling', options.centreSampling);
    }
  }
  return this;
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
const crop = function crop (crop) {
  this.options.canvas = 'crop';
  if (!is.defined(crop)) {
    // Default
    this.options.crop = gravity.center;
  } else if (is.integer(crop) && is.inRange(crop, 0, 8)) {
    // Gravity (numeric)
    this.options.crop = crop;
  } else if (is.string(crop) && is.integer(gravity[crop])) {
    // Gravity (string)
    this.options.crop = gravity[crop];
  } else if (is.integer(crop) && crop >= strategy.entropy) {
    // Strategy
    this.options.crop = crop;
  } else {
    throw is.invalidParameterError('crop', 'valid crop id/name/strategy', crop);
  }
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
 *   .background({r: 0, g: 0, b: 0, alpha: 0})
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
const embed = function embed () {
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
const max = function max () {
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
const min = function min () {
  this.options.canvas = 'min';
  return this;
};

/**
 * Ignoring the aspect ratio of the input, stretch the image to
 * the exact `width` and/or `height` provided via `resize`.
 * @returns {Sharp}
 */
const ignoreAspectRatio = function ignoreAspectRatio () {
  this.options.canvas = 'ignore_aspect';
  return this;
};

/**
 * Do not enlarge the output image if the input image width *or* height are already less than the required dimensions.
 * This is equivalent to GraphicsMagick's `>` geometry option:
 * "*change the dimensions of the image only if its width or height exceeds the geometry specification*".
 * @param {Boolean} [withoutEnlargement=true]
 * @returns {Sharp}
*/
const withoutEnlargement = function withoutEnlargement (withoutEnlargement) {
  this.options.withoutEnlargement = is.bool(withoutEnlargement) ? withoutEnlargement : true;
  return this;
};

/**
 * Decorate the Sharp prototype with resize-related functions.
 * @private
 */
module.exports = function (Sharp) {
  [
    resize,
    crop,
    embed,
    max,
    min,
    ignoreAspectRatio,
    withoutEnlargement
  ].forEach(function (f) {
    Sharp.prototype[f.name] = f;
  });
  // Class attributes
  Sharp.gravity = gravity;
  Sharp.strategy = strategy;
  Sharp.kernel = kernel;
  Sharp.interpolator = interpolator;
};
