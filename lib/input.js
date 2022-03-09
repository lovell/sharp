'use strict';

const color = require('color');
const is = require('./is');
const sharp = require('./sharp');

/**
 * Extract input options, if any, from an object.
 * @private
 */
function _inputOptionsFromObject (obj) {
  const { raw, density, limitInputPixels, unlimited, sequentialRead, failOnError, animated, page, pages, subifd } = obj;
  return [raw, density, limitInputPixels, unlimited, sequentialRead, failOnError, animated, page, pages, subifd].some(is.defined)
    ? { raw, density, limitInputPixels, unlimited, sequentialRead, failOnError, animated, page, pages, subifd }
    : undefined;
}

/**
 * Create Object containing input and input-related options.
 * @private
 */
function _createInputDescriptor (input, inputOptions, containerOptions) {
  const inputDescriptor = {
    failOnError: true,
    limitInputPixels: Math.pow(0x3FFF, 2),
    unlimited: false,
    sequentialRead: false
  };
  if (is.string(input)) {
    // filesystem
    inputDescriptor.file = input;
  } else if (is.buffer(input)) {
    // Buffer
    if (input.length === 0) {
      throw Error('Input Buffer is empty');
    }
    inputDescriptor.buffer = input;
  } else if (is.typedArray(input)) {
    if (input.length === 0) {
      throw Error('Input Bit Array is empty');
    }
    inputDescriptor.buffer = Buffer.from(input.buffer);
  } else if (is.plainObject(input) && !is.defined(inputOptions)) {
    // Plain Object descriptor, e.g. create
    inputOptions = input;
    if (_inputOptionsFromObject(inputOptions)) {
      // Stream with options
      inputDescriptor.buffer = [];
    }
  } else if (!is.defined(input) && !is.defined(inputOptions) && is.object(containerOptions) && containerOptions.allowStream) {
    // Stream without options
    inputDescriptor.buffer = [];
  } else {
    throw new Error(`Unsupported input '${input}' of type ${typeof input}${
      is.defined(inputOptions) ? ` when also providing options of type ${typeof inputOptions}` : ''
    }`);
  }
  if (is.object(inputOptions)) {
    // Fail on error
    if (is.defined(inputOptions.failOnError)) {
      if (is.bool(inputOptions.failOnError)) {
        inputDescriptor.failOnError = inputOptions.failOnError;
      } else {
        throw is.invalidParameterError('failOnError', 'boolean', inputOptions.failOnError);
      }
    }
    // Density
    if (is.defined(inputOptions.density)) {
      if (is.inRange(inputOptions.density, 1, 100000)) {
        inputDescriptor.density = inputOptions.density;
      } else {
        throw is.invalidParameterError('density', 'number between 1 and 100000', inputOptions.density);
      }
    }
    // limitInputPixels
    if (is.defined(inputOptions.limitInputPixels)) {
      if (is.bool(inputOptions.limitInputPixels)) {
        inputDescriptor.limitInputPixels = inputOptions.limitInputPixels
          ? Math.pow(0x3FFF, 2)
          : 0;
      } else if (is.integer(inputOptions.limitInputPixels) && inputOptions.limitInputPixels >= 0) {
        inputDescriptor.limitInputPixels = inputOptions.limitInputPixels;
      } else {
        throw is.invalidParameterError('limitInputPixels', 'integer >= 0', inputOptions.limitInputPixels);
      }
    }
    // unlimited
    if (is.defined(inputOptions.unlimited)) {
      if (is.bool(inputOptions.unlimited)) {
        inputDescriptor.unlimited = inputOptions.unlimited;
      } else {
        throw is.invalidParameterError('unlimited', 'boolean', inputOptions.unlimited);
      }
    }
    // sequentialRead
    if (is.defined(inputOptions.sequentialRead)) {
      if (is.bool(inputOptions.sequentialRead)) {
        inputDescriptor.sequentialRead = inputOptions.sequentialRead;
      } else {
        throw is.invalidParameterError('sequentialRead', 'boolean', inputOptions.sequentialRead);
      }
    }
    // Raw pixel input
    if (is.defined(inputOptions.raw)) {
      if (
        is.object(inputOptions.raw) &&
        is.integer(inputOptions.raw.width) && inputOptions.raw.width > 0 &&
        is.integer(inputOptions.raw.height) && inputOptions.raw.height > 0 &&
        is.integer(inputOptions.raw.channels) && is.inRange(inputOptions.raw.channels, 1, 4)
      ) {
        inputDescriptor.rawWidth = inputOptions.raw.width;
        inputDescriptor.rawHeight = inputOptions.raw.height;
        inputDescriptor.rawChannels = inputOptions.raw.channels;
        inputDescriptor.rawPremultiplied = !!inputOptions.raw.premultiplied;

        switch (input.constructor) {
          case Uint8Array:
          case Uint8ClampedArray:
            inputDescriptor.rawDepth = 'uchar';
            break;
          case Int8Array:
            inputDescriptor.rawDepth = 'char';
            break;
          case Uint16Array:
            inputDescriptor.rawDepth = 'ushort';
            break;
          case Int16Array:
            inputDescriptor.rawDepth = 'short';
            break;
          case Uint32Array:
            inputDescriptor.rawDepth = 'uint';
            break;
          case Int32Array:
            inputDescriptor.rawDepth = 'int';
            break;
          case Float32Array:
            inputDescriptor.rawDepth = 'float';
            break;
          case Float64Array:
            inputDescriptor.rawDepth = 'double';
            break;
          default:
            inputDescriptor.rawDepth = 'uchar';
            break;
        }
      } else {
        throw new Error('Expected width, height and channels for raw pixel input');
      }
    }
    // Multi-page input (GIF, TIFF, PDF)
    if (is.defined(inputOptions.animated)) {
      if (is.bool(inputOptions.animated)) {
        inputDescriptor.pages = inputOptions.animated ? -1 : 1;
      } else {
        throw is.invalidParameterError('animated', 'boolean', inputOptions.animated);
      }
    }
    if (is.defined(inputOptions.pages)) {
      if (is.integer(inputOptions.pages) && is.inRange(inputOptions.pages, -1, 100000)) {
        inputDescriptor.pages = inputOptions.pages;
      } else {
        throw is.invalidParameterError('pages', 'integer between -1 and 100000', inputOptions.pages);
      }
    }
    if (is.defined(inputOptions.page)) {
      if (is.integer(inputOptions.page) && is.inRange(inputOptions.page, 0, 100000)) {
        inputDescriptor.page = inputOptions.page;
      } else {
        throw is.invalidParameterError('page', 'integer between 0 and 100000', inputOptions.page);
      }
    }
    // Multi-level input (OpenSlide)
    if (is.defined(inputOptions.level)) {
      if (is.integer(inputOptions.level) && is.inRange(inputOptions.level, 0, 256)) {
        inputDescriptor.level = inputOptions.level;
      } else {
        throw is.invalidParameterError('level', 'integer between 0 and 256', inputOptions.level);
      }
    }
    // Sub Image File Directory (TIFF)
    if (is.defined(inputOptions.subifd)) {
      if (is.integer(inputOptions.subifd) && is.inRange(inputOptions.subifd, -1, 100000)) {
        inputDescriptor.subifd = inputOptions.subifd;
      } else {
        throw is.invalidParameterError('subifd', 'integer between -1 and 100000', inputOptions.subifd);
      }
    }
    // Create new image
    if (is.defined(inputOptions.create)) {
      if (
        is.object(inputOptions.create) &&
        is.integer(inputOptions.create.width) && inputOptions.create.width > 0 &&
        is.integer(inputOptions.create.height) && inputOptions.create.height > 0 &&
        is.integer(inputOptions.create.channels)
      ) {
        inputDescriptor.createWidth = inputOptions.create.width;
        inputDescriptor.createHeight = inputOptions.create.height;
        inputDescriptor.createChannels = inputOptions.create.channels;
        // Noise
        if (is.defined(inputOptions.create.noise)) {
          if (!is.object(inputOptions.create.noise)) {
            throw new Error('Expected noise to be an object');
          }
          if (!is.inArray(inputOptions.create.noise.type, ['gaussian'])) {
            throw new Error('Only gaussian noise is supported at the moment');
          }
          if (!is.inRange(inputOptions.create.channels, 1, 4)) {
            throw is.invalidParameterError('create.channels', 'number between 1 and 4', inputOptions.create.channels);
          }
          inputDescriptor.createNoiseType = inputOptions.create.noise.type;
          if (is.number(inputOptions.create.noise.mean) && is.inRange(inputOptions.create.noise.mean, 0, 10000)) {
            inputDescriptor.createNoiseMean = inputOptions.create.noise.mean;
          } else {
            throw is.invalidParameterError('create.noise.mean', 'number between 0 and 10000', inputOptions.create.noise.mean);
          }
          if (is.number(inputOptions.create.noise.sigma) && is.inRange(inputOptions.create.noise.sigma, 0, 10000)) {
            inputDescriptor.createNoiseSigma = inputOptions.create.noise.sigma;
          } else {
            throw is.invalidParameterError('create.noise.sigma', 'number between 0 and 10000', inputOptions.create.noise.sigma);
          }
        } else if (is.defined(inputOptions.create.background)) {
          if (!is.inRange(inputOptions.create.channels, 3, 4)) {
            throw is.invalidParameterError('create.channels', 'number between 3 and 4', inputOptions.create.channels);
          }
          const background = color(inputOptions.create.background);
          inputDescriptor.createBackground = [
            background.red(),
            background.green(),
            background.blue(),
            Math.round(background.alpha() * 255)
          ];
        } else {
          throw new Error('Expected valid noise or background to create a new input image');
        }
        delete inputDescriptor.buffer;
      } else {
        throw new Error('Expected valid width, height and channels to create a new input image');
      }
    }
  } else if (is.defined(inputOptions)) {
    throw new Error('Invalid input options ' + inputOptions);
  }
  return inputDescriptor;
}

/**
 * Handle incoming Buffer chunk on Writable Stream.
 * @private
 * @param {Buffer} chunk
 * @param {string} encoding - unused
 * @param {Function} callback
 */
function _write (chunk, encoding, callback) {
  /* istanbul ignore else */
  if (Array.isArray(this.options.input.buffer)) {
    /* istanbul ignore else */
    if (is.buffer(chunk)) {
      if (this.options.input.buffer.length === 0) {
        this.on('finish', () => {
          this.streamInFinished = true;
        });
      }
      this.options.input.buffer.push(chunk);
      callback();
    } else {
      callback(new Error('Non-Buffer data on Writable Stream'));
    }
  } else {
    callback(new Error('Unexpected data on Writable Stream'));
  }
}

/**
 * Flattens the array of chunks accumulated in input.buffer.
 * @private
 */
function _flattenBufferIn () {
  if (this._isStreamInput()) {
    this.options.input.buffer = Buffer.concat(this.options.input.buffer);
  }
}

/**
 * Are we expecting Stream-based input?
 * @private
 * @returns {boolean}
 */
function _isStreamInput () {
  return Array.isArray(this.options.input.buffer);
}

/**
 * Fast access to (uncached) image metadata without decoding any compressed pixel data.
 *
 * This is taken from the header of the input image.
 * It does not include operations, such as resize, to be applied to the output image.
 *
 * A `Promise` is returned when `callback` is not provided.
 *
 * - `format`: Name of decoder used to decompress image data e.g. `jpeg`, `png`, `webp`, `gif`, `svg`
 * - `size`: Total size of image in bytes, for Stream and Buffer input only
 * - `width`: Number of pixels wide (EXIF orientation is not taken into consideration, see example below)
 * - `height`: Number of pixels high (EXIF orientation is not taken into consideration, see example below)
 * - `space`: Name of colour space interpretation e.g. `srgb`, `rgb`, `cmyk`, `lab`, `b-w` [...](https://libvips.github.io/libvips/API/current/VipsImage.html#VipsInterpretation)
 * - `channels`: Number of bands e.g. `3` for sRGB, `4` for CMYK
 * - `depth`: Name of pixel depth format e.g. `uchar`, `char`, `ushort`, `float` [...](https://libvips.github.io/libvips/API/current/VipsImage.html#VipsBandFormat)
 * - `density`: Number of pixels per inch (DPI), if present
 * - `chromaSubsampling`: String containing JPEG chroma subsampling, `4:2:0` or `4:4:4` for RGB, `4:2:0:4` or `4:4:4:4` for CMYK
 * - `isProgressive`: Boolean indicating whether the image is interlaced using a progressive scan
 * - `pages`: Number of pages/frames contained within the image, with support for TIFF, HEIF, PDF, animated GIF and animated WebP
 * - `pageHeight`: Number of pixels high each page in a multi-page image will be.
 * - `loop`: Number of times to loop an animated image, zero refers to a continuous loop.
 * - `delay`: Delay in ms between each page in an animated image, provided as an array of integers.
 * - `pagePrimary`: Number of the primary page in a HEIF image
 * - `levels`: Details of each level in a multi-level image provided as an array of objects, requires libvips compiled with support for OpenSlide
 * - `subifds`: Number of Sub Image File Directories in an OME-TIFF image
 * - `background`: Default background colour, if present, for PNG (bKGD) and GIF images, either an RGB Object or a single greyscale value
 * - `compression`: The encoder used to compress an HEIF file, `av1` (AVIF) or `hevc` (HEIC)
 * - `resolutionUnit`: The unit of resolution (density), either `inch` or `cm`, if present
 * - `hasProfile`: Boolean indicating the presence of an embedded ICC profile
 * - `hasAlpha`: Boolean indicating the presence of an alpha transparency channel
 * - `orientation`: Number value of the EXIF Orientation header, if present
 * - `exif`: Buffer containing raw EXIF data, if present
 * - `icc`: Buffer containing raw [ICC](https://www.npmjs.com/package/icc) profile data, if present
 * - `iptc`: Buffer containing raw IPTC data, if present
 * - `xmp`: Buffer containing raw XMP data, if present
 * - `tifftagPhotoshop`: Buffer containing raw TIFFTAG_PHOTOSHOP data, if present
 *
 * @example
 * const metadata = await sharp(input).metadata();
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
 * @example
 * // Based on EXIF rotation metadata, get the right-side-up width and height:
 *
 * const size = getNormalSize(await sharp(input).metadata());
 *
 * function getNormalSize({ width, height, orientation }) {
 *   return orientation || 0 >= 5
 *     ? { width: height, height: width }
 *     : { width, height };
 * }
 *
 * @param {Function} [callback] - called with the arguments `(err, metadata)`
 * @returns {Promise<Object>|Sharp}
 */
function metadata (callback) {
  if (is.fn(callback)) {
    if (this._isStreamInput()) {
      this.on('finish', () => {
        this._flattenBufferIn();
        sharp.metadata(this.options, callback);
      });
    } else {
      sharp.metadata(this.options, callback);
    }
    return this;
  } else {
    if (this._isStreamInput()) {
      return new Promise((resolve, reject) => {
        this.on('finish', () => {
          this._flattenBufferIn();
          sharp.metadata(this.options, (err, metadata) => {
            if (err) {
              reject(err);
            } else {
              resolve(metadata);
            }
          });
        });
      });
    } else {
      return new Promise((resolve, reject) => {
        sharp.metadata(this.options, (err, metadata) => {
          if (err) {
            reject(err);
          } else {
            resolve(metadata);
          }
        });
      });
    }
  }
}

/**
 * Access to pixel-derived image statistics for every channel in the image.
 * A `Promise` is returned when `callback` is not provided.
 *
 * - `channels`: Array of channel statistics for each channel in the image. Each channel statistic contains
 *     - `min` (minimum value in the channel)
 *     - `max` (maximum value in the channel)
 *     - `sum` (sum of all values in a channel)
 *     - `squaresSum` (sum of squared values in a channel)
 *     - `mean` (mean of the values in a channel)
 *     - `stdev` (standard deviation for the values in a channel)
 *     - `minX` (x-coordinate of one of the pixel where the minimum lies)
 *     - `minY` (y-coordinate of one of the pixel where the minimum lies)
 *     - `maxX` (x-coordinate of one of the pixel where the maximum lies)
 *     - `maxY` (y-coordinate of one of the pixel where the maximum lies)
 * - `isOpaque`: Is the image fully opaque? Will be `true` if the image has no alpha channel or if every pixel is fully opaque.
 * - `entropy`: Histogram-based estimation of greyscale entropy, discarding alpha channel if any.
 * - `sharpness`: Estimation of greyscale sharpness based on the standard deviation of a Laplacian convolution, discarding alpha channel if any.
 * - `dominant`: Object containing most dominant sRGB colour based on a 4096-bin 3D histogram.
 *
 * **Note**: Statistics are derived from the original input image. Any operations performed on the image must first be
 * written to a buffer in order to run `stats` on the result (see third example).
 *
 * @example
 * const image = sharp(inputJpg);
 * image
 *   .stats()
 *   .then(function(stats) {
 *      // stats contains the channel-wise statistics array and the isOpaque value
 *   });
 *
 * @example
 * const { entropy, sharpness, dominant } = await sharp(input).stats();
 * const { r, g, b } = dominant;
 *
 * @example
 * const image = sharp(input);
 * // store intermediate result
 * const part = await image.extract(region).toBuffer();
 * // create new instance to obtain statistics of extracted region
 * const stats = await sharp(part).stats();
 *
 * @param {Function} [callback] - called with the arguments `(err, stats)`
 * @returns {Promise<Object>}
 */
function stats (callback) {
  if (is.fn(callback)) {
    if (this._isStreamInput()) {
      this.on('finish', () => {
        this._flattenBufferIn();
        sharp.stats(this.options, callback);
      });
    } else {
      sharp.stats(this.options, callback);
    }
    return this;
  } else {
    if (this._isStreamInput()) {
      return new Promise((resolve, reject) => {
        this.on('finish', function () {
          this._flattenBufferIn();
          sharp.stats(this.options, (err, stats) => {
            if (err) {
              reject(err);
            } else {
              resolve(stats);
            }
          });
        });
      });
    } else {
      return new Promise((resolve, reject) => {
        sharp.stats(this.options, (err, stats) => {
          if (err) {
            reject(err);
          } else {
            resolve(stats);
          }
        });
      });
    }
  }
}

/**
 * Decorate the Sharp prototype with input-related functions.
 * @private
 */
module.exports = function (Sharp) {
  Object.assign(Sharp.prototype, {
    // Private
    _inputOptionsFromObject,
    _createInputDescriptor,
    _write,
    _flattenBufferIn,
    _isStreamInput,
    // Public
    metadata,
    stats
  });
};
