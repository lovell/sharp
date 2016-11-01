'use strict';

const is = require('./is');

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
 * @param {(Buffer|String)} overlay - Buffer containing image data or String containing the path to an image file.
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
const overlayWith = function overlayWith (overlay, options) {
  this.options.overlay = this._createInputDescriptor(overlay, options, {
    allowStream: false
  });
  if (is.object(options)) {
    if (is.defined(options.tile)) {
      if (is.bool(options.tile)) {
        this.options.overlayTile = options.tile;
      } else {
        throw new Error('Invalid overlay tile ' + options.tile);
      }
    }
    if (is.defined(options.cutout)) {
      if (is.bool(options.cutout)) {
        this.options.overlayCutout = options.cutout;
      } else {
        throw new Error('Invalid overlay cutout ' + options.cutout);
      }
    }
    if (is.defined(options.left) || is.defined(options.top)) {
      if (
        is.integer(options.left) && is.inRange(options.left, 0, this.constructor.maximum.width) &&
        is.integer(options.top) && is.inRange(options.top, 0, this.constructor.maximum.height)
      ) {
        this.options.overlayXOffset = options.left;
        this.options.overlayYOffset = options.top;
      } else {
        throw new Error('Invalid overlay left ' + options.left + ' and/or top ' + options.top);
      }
    }
    if (is.defined(options.gravity)) {
      if (is.integer(options.gravity) && is.inRange(options.gravity, 0, 8)) {
        this.options.overlayGravity = options.gravity;
      } else if (is.string(options.gravity) && is.integer(this.constructor.gravity[options.gravity])) {
        this.options.overlayGravity = this.constructor.gravity[options.gravity];
      } else {
        throw new Error('Unsupported overlay gravity ' + options.gravity);
      }
    }
  }
  return this;
};

/**
 * Decorate the Sharp prototype with composite-related functions.
 * @private
 */
module.exports = function (Sharp) {
  Sharp.prototype.overlayWith = overlayWith;
};
