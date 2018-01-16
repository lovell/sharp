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
  nearest: 'nearest',
  cubic: 'cubic',
  lanczos2: 'lanczos2',
  lanczos3: 'lanczos3'
};

/**
 * Resize image to `width` x `height`.
 * By default, the resized image is centre cropped to the exact size specified.
 *
 * Possible kernels are:
 * - `nearest`: Use [nearest neighbour interpolation](http://en.wikipedia.org/wiki/Nearest-neighbor_interpolation).
 * - `cubic`: Use a [Catmull-Rom spline](https://en.wikipedia.org/wiki/Centripetal_Catmull%E2%80%93Rom_spline).
 * - `lanczos2`: Use a [Lanczos kernel](https://en.wikipedia.org/wiki/Lanczos_resampling#Lanczos_kernel) with `a=2`.
 * - `lanczos3`: Use a Lanczos kernel with `a=3` (the default).
 *
 * @example
 * sharp(inputBuffer)
 *   .resize(200, 300, {
 *     kernel: sharp.kernel.nearest
 *   })
 *   .background('white')
 *   .embed()
 *   .toFile('output.tiff')
 *   .then(function() {
 *     // output.tiff is a 200 pixels wide and 300 pixels high image
 *     // containing a nearest-neighbour scaled version, embedded on a white canvas,
 *     // of the image data in inputBuffer
 *   });
 *
 * @param {Number} [width] - pixels wide the resultant image should be. Use `null` or `undefined` to auto-scale the width to match the height.
 * @param {Number} [height] - pixels high the resultant image should be. Use `null` or `undefined` to auto-scale the height to match the width.
 * @param {Object} [options]
 * @param {String} [options.kernel='lanczos3'] - the kernel to use for image reduction.
 * @param {Boolean} [options.fastShrinkOnLoad=true] - take greater advantage of the JPEG and WebP shrink-on-load feature, which can lead to a slight moiré pattern on some images.
 * @returns {Sharp}
 * @throws {Error} Invalid parameters
 */
function resize (width, height, options) {
  if (is.defined(width)) {
    if (is.integer(width) && width > 0) {
      this.options.width = width;
    } else {
      throw is.invalidParameterError('width', 'positive integer', width);
    }
  } else {
    this.options.width = -1;
  }
  if (is.defined(height)) {
    if (is.integer(height) && height > 0) {
      this.options.height = height;
    } else {
      throw is.invalidParameterError('height', 'positive integer', height);
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
    // Shrink on load
    if (is.defined(options.fastShrinkOnLoad)) {
      this._setBooleanOption('fastShrinkOnLoad', options.fastShrinkOnLoad);
    }
  }
  return this;
}

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
function crop (crop) {
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
  } else if (is.string(crop) && is.integer(strategy[crop])) {
    // Strategy (string)
    this.options.crop = strategy[crop];
  } else {
    throw is.invalidParameterError('crop', 'valid crop id/name/strategy', crop);
  }
  return this;
}

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
 * @param {String} [embed='centre'] - A member of `sharp.gravity` to embed to an edge/corner.
 * @returns {Sharp}
 * @throws {Error} Invalid parameters
 */
function embed (embed) {
  this.options.canvas = 'embed';

  if (!is.defined(embed)) {
    // Default
    this.options.embed = gravity.center;
  } else if (is.integer(embed) && is.inRange(embed, 0, 8)) {
    // Gravity (numeric)
    this.options.embed = embed;
  } else if (is.string(embed) && is.integer(gravity[embed])) {
    // Gravity (string)
    this.options.embed = gravity[embed];
  } else {
    throw is.invalidParameterError('embed', 'valid embed id/name', embed);
  }

  return this;
}

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
function max () {
  this.options.canvas = 'max';
  return this;
}

/**
 * Preserving aspect ratio, resize the image to be as small as possible
 * while ensuring its dimensions are greater than or equal to the `width` and `height` specified.
 *
 * Both `width` and `height` must be provided via `resize` otherwise the behaviour will default to `crop`.
 *
 * @returns {Sharp}
 */
function min () {
  this.options.canvas = 'min';
  return this;
}

/**
 * Ignoring the aspect ratio of the input, stretch the image to
 * the exact `width` and/or `height` provided via `resize`.
 * @returns {Sharp}
 */
function ignoreAspectRatio () {
  this.options.canvas = 'ignore_aspect';
  return this;
}

/**
 * Do not enlarge the output image if the input image width *or* height are already less than the required dimensions.
 * This is equivalent to GraphicsMagick's `>` geometry option:
 * "*change the dimensions of the image only if its width or height exceeds the geometry specification*".
 * Use with `max()` to preserve the image's aspect ratio.
 *
 * The default behaviour *before* function call is `false`, meaning the image will be enlarged.
 *
 * @param {Boolean} [withoutEnlargement=true]
 * @returns {Sharp}
*/
function withoutEnlargement (withoutEnlargement) {
  this.options.withoutEnlargement = is.bool(withoutEnlargement) ? withoutEnlargement : true;
  return this;
}

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
};
