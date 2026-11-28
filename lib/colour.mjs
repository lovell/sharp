/*!
  SPDX-FileCopyrightText: 2013 Lovell Fuller and others
  SPDX-License-Identifier: Apache-2.0
*/

import { convert, parse, toGamut } from 'hueful';
import is from './is.mjs';

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
 * Tint the image using the provided colour.
 * An alpha channel may be present and will be unchanged by the operation.
 *
 * @example
 * const output = await sharp(input)
 *   .tint({ r: 255, g: 240, b: 16 })
 *   .toBuffer();
 *
 * @param {string|Object} tint - Parsed by the [hueful](https://www.npmjs.org/package/hueful) module.
 * @returns {Sharp}
 * @throws {Error} Invalid parameter
 */
function tint (tint) {
  this._setBackgroundColourOption('tint', tint);
  return this;
}

/**
 * Convert to 8-bit greyscale; 256 shades of grey.
 * This is a linear operation. If the input image is in a non-linear colour space such as sRGB, use `gamma()` with `greyscale()` for the best results.
 * By default the output image will be web-friendly sRGB and contain three (identical) colour channels.
 * This may be overridden by other sharp operations such as `toColourspace('b-w')`,
 * which will produce an output image containing one colour channel.
 * An alpha channel may be present, and will be unchanged by the operation.
 *
 * @example
 * const output = await sharp(input).greyscale().toBuffer();
 *
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
 * Set the pipeline colourspace.
 *
 * The input image will be converted to the provided colourspace at the start of the pipeline.
 * All operations will use this colourspace before converting to the output colourspace,
 * as defined by {@link #tocolourspace toColourspace}.
 *
 * @since 0.29.0
 *
 * @example
 * // Run pipeline in 16 bits per channel RGB while converting final result to 8 bits per channel sRGB.
 * await sharp(input)
 *  .pipelineColourspace('rgb16')
 *  .toColourspace('srgb')
 *  .toFile('16bpc-pipeline-to-8bpc-output.png')
 *
 * @param {string} [colourspace] - pipeline colourspace e.g. `rgb16`, `scrgb`, `lab`, `grey16` [...](https://www.libvips.org/API/current/enum.Interpretation.html)
 * @returns {Sharp}
 * @throws {Error} Invalid parameters
 */
function pipelineColourspace (colourspace) {
  if (!is.string(colourspace)) {
    throw is.invalidParameterError('colourspace', 'string', colourspace);
  }
  this.options.colourspacePipeline = colourspace;
  return this;
}

/**
 * Alternative spelling of `pipelineColourspace`.
 * @param {string} [colorspace] - pipeline colorspace.
 * @returns {Sharp}
 * @throws {Error} Invalid parameters
 */
function pipelineColorspace (colorspace) {
  return this.pipelineColourspace(colorspace);
}

/**
 * Set the output colourspace.
 * By default output image will be web-friendly sRGB, with additional channels interpreted as alpha channels.
 *
 * @example
 * // Output 16 bits per channel RGB
 * await sharp(input)
 *  .toColourspace('rgb16')
 *  .toFile('16-bpp.png')
 *
 * @param {string} [colourspace] - output colourspace e.g. `srgb`, `rgb`, `cmyk`, `lab`, `b-w` [...](https://www.libvips.org/API/current/enum.Interpretation.html)
 * @returns {Sharp}
 * @throws {Error} Invalid parameters
 */
function toColourspace (colourspace) {
  if (!is.string(colourspace)) {
    throw is.invalidParameterError('colourspace', 'string', colourspace);
  }
  this.options.colourspace = colourspace;
  return this;
}

/**
 * Alternative spelling of `toColourspace`.
 * @param {string} [colorspace] - output colorspace.
 * @returns {Sharp}
 * @throws {Error} Invalid parameters
 */
function toColorspace (colorspace) {
  return this.toColourspace(colorspace);
}

/**
 * Object keys, in channel order, for each supported colour space.
 * @private
 */
const objectSpaces = [
  ['rgb', ['r', 'g', 'b']],
  ['hsl', ['h', 's', 'l']],
  ['hwb', ['h', 'w', 'b']],
  ['lab', ['l', 'a', 'b']],
  ['lch', ['l', 'c', 'h']],
  ['cmyk', ['c', 'm', 'y', 'k']]
];

/**
 * Channel names used in error messages for RGB colours.
 * @private
 */
const rgbChannelNames = ['red', 'green', 'blue', 'alpha'];

/**
 * Parse an array such as `[r, g, b, alpha]`, or an object such as `{ r, g, b, alpha }` or `{ h, s, l }`,
 * to a colour space and tuple.
 * CMYK channels are percentages (0-100).
 * @private
 * @param {Object} value
 * @returns {{space: string, value: number[]}|null} Colour space and tuple with optional alpha, or null if the object is not a recognised colour.
 * @throws {Error} Non-numeric channel
 */
function parseObject (value) {
  let space;
  let channels;
  if (Array.isArray(value)) {
    space = 'rgb';
    channels = rgbChannelNames.slice(0, Math.max(value.length, 3)).map((name, i) => [name, value[i]]);
  } else {
    const keys = Object.keys(value).filter((key) => key !== 'alpha').sort().join();
    const match = objectSpaces.find(([, spaceKeys]) => [...spaceKeys].sort().join() === keys);
    if (!match) {
      return null;
    }
    const [matchedSpace, spaceKeys] = match;
    space = matchedSpace;
    channels = spaceKeys.map((key, i) => [space === 'rgb' ? rgbChannelNames[i] : key, value[key]]);
    if (is.defined(value.alpha)) {
      channels.push(['alpha', value.alpha]);
    }
  }
  const coords = channels.map(([name, component]) => {
    const coord = Number(component);
    if (!is.number(coord)) {
      throw is.invalidParameterError(`background.${name}`, 'number', coord);
    }
    return space === 'cmyk' && name !== 'alpha' ? coord / 100 : coord;
  });
  return { space, value: coords };
}

/**
 * Create a RGBA colour array from a given value.
 * Colours outside the sRGB gamut are mapped into it.
 * @private
 * @param {string|Object} value
 * @throws {Error} Invalid value
 */
function _getBackgroundColourOption (value) {
  let parsed;
  if (is.object(value)) {
    parsed = parseObject(value);
    if (!parsed) {
      throw new Error(`Unable to parse color from object: ${JSON.stringify(value)}`);
    }
  } else if (is.string(value) && value.length >= 3 && value.length <= 200) {
    parsed = parse(value);
    if (!parsed) {
      throw new Error(`Unable to parse color from string: ${value}`);
    }
  } else {
    throw is.invalidParameterError('background', 'object or string', value);
  }
  const [red, green, blue, alpha = 1] = convert(parsed.space, 'rgb', toGamut(parsed.space, parsed.value));
  return [
    Math.round(red),
    Math.round(green),
    Math.round(blue),
    Math.round(Math.min(Math.max(alpha, 0), 1) * 255)
  ];
}

/**
 * Update a colour attribute of the this.options Object.
 * @private
 * @param {string} key
 * @param {string|Object} value
 * @throws {Error} Invalid value
 */
function _setBackgroundColourOption (key, value) {
  if (is.defined(value)) {
    this.options[key] = _getBackgroundColourOption(value);
  }
}

/**
 * Decorate the Sharp prototype with colour-related functions.
 * @module Sharp
 * @private
 */
export default (Sharp) => {
  Object.assign(Sharp.prototype, {
    // Public
    tint,
    greyscale,
    grayscale,
    pipelineColourspace,
    pipelineColorspace,
    toColourspace,
    toColorspace,
    // Private
    _getBackgroundColourOption,
    _setBackgroundColourOption
  });
  // Class attributes
  Sharp.colourspace = colourspace;
  Sharp.colorspace = colourspace;
};
