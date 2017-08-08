'use strict';

const color = require('color');
const is = require('./is');

/**
 * Colourspaces.
 * @private
 */
const colourspace = {
  multiband: 'multiband',
  'b-w': 'b-w',
  bw: 'b-w',
  cmyk: 'cmyk',
  srgb: 'srgb'
};

/**
 * Set the background for the `embed`, `flatten` and `extend` operations.
 * The default background is `{r: 0, g: 0, b: 0, alpha: 1}`, black without transparency.
 *
 * Delegates to the _color_ module, which can throw an Error
 * but is liberal in what it accepts, clipping values to sensible min/max.
 * The alpha value is a float between `0` (transparent) and `1` (opaque).
 *
 * @param {String|Object} rgba - parsed by the [color](https://www.npmjs.org/package/color) module to extract values for red, green, blue and alpha.
 * @returns {Sharp}
 * @throws {Error} Invalid parameter
 */
function background (rgba) {
  const colour = color(rgba);
  this.options.background = [
    colour.red(),
    colour.green(),
    colour.blue(),
    Math.round(colour.alpha() * 255)
  ];
  return this;
}

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
function greyscale (greyscale) {
  this.options.greyscale = is.bool(greyscale) ? greyscale : true;
  return this;
}

/**
 * Alternative spelling of `greyscale`.
 * @param {Boolean} [grayscale=true]
 * @returns {Sharp}
 */
function grayscale (grayscale) {
  return this.greyscale(grayscale);
}

/**
 * Set the output colourspace.
 * By default output image will be web-friendly sRGB, with additional channels interpreted as alpha channels.
 * @param {String} [colourspace] - output colourspace e.g. `srgb`, `rgb`, `cmyk`, `lab`, `b-w` [...](https://github.com/jcupitt/libvips/blob/master/libvips/iofuncs/enumtypes.c#L568)
 * @returns {Sharp}
 * @throws {Error} Invalid parameters
 */
function toColourspace (colourspace) {
  if (!is.string(colourspace)) {
    throw new Error('Invalid output colourspace ' + colourspace);
  }
  this.options.colourspace = colourspace;
  return this;
}

/**
 * Alternative spelling of `toColourspace`.
 * @param {String} [colorspace] - output colorspace.
 * @returns {Sharp}
 * @throws {Error} Invalid parameters
 */
function toColorspace (colorspace) {
  return this.toColourspace(colorspace);
}

/**
 * Decorate the Sharp prototype with colour-related functions.
 * @private
 */
module.exports = function (Sharp) {
  // Public instance functions
  [
    background,
    greyscale,
    grayscale,
    toColourspace,
    toColorspace
  ].forEach(function (f) {
    Sharp.prototype[f.name] = f;
  });
  // Class attributes
  Sharp.colourspace = colourspace;
  Sharp.colorspace = colourspace;
};
