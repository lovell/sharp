'use strict';

const util = require('util');
const is = require('./is');
const sharp = require('../build/Release/sharp.node');

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
 * @returns {Promise<Object>} - when no callback is provided
 * @throws {Error} Invalid parameters
 */
const toFile = function toFile (fileOut, callback) {
  if (!fileOut || fileOut.length === 0) {
    const errOutputInvalid = new Error('Invalid output');
    if (is.fn(callback)) {
      callback(errOutputInvalid);
    } else {
      return Promise.reject(errOutputInvalid);
    }
  } else {
    if (this.options.input.file === fileOut) {
      const errOutputIsInput = new Error('Cannot use same file for input and output');
      if (is.fn(callback)) {
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
 * JPEG, PNG, WebP, and RAW output are supported.
 * By default, the format will match the input image, except GIF and SVG input which become PNG output.
 *
 * `callback`, if present, gets three arguments `(err, buffer, info)` where:
 * - `err` is an error message, if any.
 * - `buffer` is the output image data.
 * - `info` contains the output image `format`, `size` (bytes), `width`, `height` and `channels`.
 * A Promises/A+ promise is returned when `callback` is not provided.
 *
 * @param {Function} [callback]
 * @returns {Promise<Buffer>} - when no callback is provided
 */
const toBuffer = function toBuffer (callback) {
  return this._pipeline(callback);
};

/**
 * Include all metadata (EXIF, XMP, IPTC) from the input image in the output image.
 * The default behaviour, when `withMetadata` is not used, is to strip all metadata and convert to the device-independent sRGB colour space.
 * This will also convert to and add a web-friendly sRGB ICC profile.
 * @param {Object} [withMetadata]
 * @param {Number} [withMetadata.orientation] value between 1 and 8, used to update the EXIF `Orientation` tag.
 * @returns {Sharp}
 * @throws {Error} Invalid parameters
 */
const withMetadata = function withMetadata (withMetadata) {
  this.options.withMetadata = is.bool(withMetadata) ? withMetadata : true;
  if (is.object(withMetadata)) {
    if (is.defined(withMetadata.orientation)) {
      if (is.integer(withMetadata.orientation) && is.inRange(withMetadata.orientation, 1, 8)) {
        this.options.withMetadataOrientation = withMetadata.orientation;
      } else {
        throw new Error('Invalid orientation (1 to 8) ' + withMetadata.orientation);
      }
    }
  }
  return this;
};

/**
 * Use these JPEG options for output image.
 * @param {Object} [options] - output options
 * @param {Number} [options.quality=80] - quality, integer 1-100
 * @param {Boolean} [options.progressive=false] - use progressive (interlace) scan
 * @param {String} [options.chromaSubsampling='4:2:0'] - set to '4:4:4' to prevent chroma subsampling when quality <= 90
 * @param {Boolean} [options.trellisQuantisation=false] - apply trellis quantisation, requires mozjpeg
 * @param {Boolean} [options.overshootDeringing=false] - apply overshoot deringing, requires mozjpeg
 * @param {Boolean} [options.optimiseScans=false] - optimise progressive scans, forces progressive, requires mozjpeg
 * @param {Boolean} [options.optimizeScans=false] - alternative spelling of optimiseScans
 * @param {Boolean} [options.force=true] - force JPEG output, otherwise attempt to use input format
 * @returns {Sharp}
 * @throws {Error} Invalid options
 */
const jpeg = function jpeg (options) {
  if (is.object(options)) {
    if (is.defined(options.quality)) {
      if (is.integer(options.quality) && is.inRange(options.quality, 1, 100)) {
        this.options.jpegQuality = options.quality;
      } else {
        throw new Error('Invalid quality (integer, 1-100) ' + options.quality);
      }
    }
    if (is.defined(options.progressive)) {
      this._setBooleanOption('jpegProgressive', options.progressive);
    }
    if (is.defined(options.chromaSubsampling)) {
      if (is.string(options.chromaSubsampling) && is.inArray(options.chromaSubsampling, ['4:2:0', '4:4:4'])) {
        this.options.jpegChromaSubsampling = options.chromaSubsampling;
      } else {
        throw new Error('Invalid chromaSubsampling (4:2:0, 4:4:4) ' + options.chromaSubsampling);
      }
    }
    options.trellisQuantisation = is.bool(options.trellisQuantization) ? options.trellisQuantization : options.trellisQuantisation;
    if (is.defined(options.trellisQuantisation)) {
      this._setBooleanOption('jpegTrellisQuantisation', options.trellisQuantisation);
    }
    if (is.defined(options.overshootDeringing)) {
      this._setBooleanOption('jpegOvershootDeringing', options.overshootDeringing);
    }
    options.optimiseScans = is.bool(options.optimizeScans) ? options.optimizeScans : options.optimiseScans;
    if (is.defined(options.optimiseScans)) {
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
const png = function png (options) {
  if (is.object(options)) {
    if (is.defined(options.progressive)) {
      this._setBooleanOption('pngProgressive', options.progressive);
    }
    if (is.defined(options.compressionLevel)) {
      if (is.integer(options.compressionLevel) && is.inRange(options.compressionLevel, 0, 9)) {
        this.options.pngCompressionLevel = options.compressionLevel;
      } else {
        throw new Error('Invalid compressionLevel (integer, 0-9) ' + options.compressionLevel);
      }
    }
    if (is.defined(options.adaptiveFiltering)) {
      this._setBooleanOption('pngAdaptiveFiltering', options.adaptiveFiltering);
    }
  }
  return this._updateFormatOut('png', options);
};

/**
 * Use these WebP options for output image.
 * @param {Object} [options] - output options
 * @param {Number} [options.quality=80] - quality, integer 1-100
 * @param {Number} [options.alphaQuality=100] - quality of alpha layer, integer 0-100
 * @param {Boolean} [options.lossless=false] - use lossless compression mode
 * @param {Boolean} [options.nearLossless=false] - use near_lossless compression mode
 * @param {Boolean} [options.force=true] - force WebP output, otherwise attempt to use input format
 * @returns {Sharp}
 * @throws {Error} Invalid options
 */
const webp = function webp (options) {
  if (is.object(options) && is.defined(options.quality)) {
    if (is.integer(options.quality) && is.inRange(options.quality, 1, 100)) {
      this.options.webpQuality = options.quality;
    } else {
      throw new Error('Invalid quality (integer, 1-100) ' + options.quality);
    }
  }
  if (is.object(options) && is.defined(options.alphaQuality)) {
    if (is.integer(options.alphaQuality) && is.inRange(options.alphaQuality, 1, 100)) {
      this.options.webpAlphaQuality = options.alphaQuality;
    } else {
      throw new Error('Invalid webp alpha quality (integer, 1-100) ' + options.alphaQuality);
    }
  }
  if (is.object(options) && is.defined(options.lossless)) {
    this._setBooleanOption('webpLossless', options.lossless);
  }
  if (is.object(options) && is.defined(options.nearLossless)) {
    this._setBooleanOption('webpNearLossless', options.nearLossless);
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
const tiff = function tiff (options) {
  if (is.object(options) && is.defined(options.quality)) {
    if (is.integer(options.quality) && is.inRange(options.quality, 1, 100)) {
      this.options.tiffQuality = options.quality;
    } else {
      throw new Error('Invalid quality (integer, 1-100) ' + options.quality);
    }
  }
  return this._updateFormatOut('tiff', options);
};

/**
 * Force output to be raw, uncompressed uint8 pixel data.
 * @returns {Sharp}
 */
const raw = function raw () {
  return this._updateFormatOut('raw');
};

/**
 * Force output to a given format.
 * @param {(String|Object)} format - as a String or an Object with an 'id' attribute
 * @param {Object} options - output options
 * @returns {Sharp}
 * @throws {Error} unsupported format or options
 */
const toFormat = function toFormat (format, options) {
  if (is.object(format) && is.string(format.id)) {
    format = format.id;
  }
  if (!is.inArray(format, ['jpeg', 'png', 'webp', 'tiff', 'raw'])) {
    throw new Error('Unsupported output format ' + format);
  }
  return this[format](options);
};

/**
 * Use tile-based deep zoom (image pyramid) output.
 * Set the format and options for tile images via the `toFormat`, `jpeg`, `png` or `webp` functions.
 * Use a `.zip` or `.szi` file extension with `toFile` to write to a compressed archive file format.
 *
 * @example
 *  sharp('input.tiff')
 *   .png()
 *   .tile({
 *     size: 512
 *   })
 *   .toFile('output.dz', function(err, info) {
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
const tile = function tile (tile) {
  if (is.object(tile)) {
    // Size of square tiles, in pixels
    if (is.defined(tile.size)) {
      if (is.integer(tile.size) && is.inRange(tile.size, 1, 8192)) {
        this.options.tileSize = tile.size;
      } else {
        throw new Error('Invalid tile size (1 to 8192) ' + tile.size);
      }
    }
    // Overlap of tiles, in pixels
    if (is.defined(tile.overlap)) {
      if (is.integer(tile.overlap) && is.inRange(tile.overlap, 0, 8192)) {
        if (tile.overlap > this.options.tileSize) {
          throw new Error('Tile overlap ' + tile.overlap + ' cannot be larger than tile size ' + this.options.tileSize);
        }
        this.options.tileOverlap = tile.overlap;
      } else {
        throw new Error('Invalid tile overlap (0 to 8192) ' + tile.overlap);
      }
    }
    // Container
    if (is.defined(tile.container)) {
      if (is.string(tile.container) && is.inArray(tile.container, ['fs', 'zip'])) {
        this.options.tileContainer = tile.container;
      } else {
        throw new Error('Invalid tile container ' + tile.container);
      }
    }
    // Layout
    if (is.defined(tile.layout)) {
      if (is.string(tile.layout) && is.inArray(tile.layout, ['dz', 'google', 'zoomify'])) {
        this.options.tileLayout = tile.layout;
      } else {
        throw new Error('Invalid tile layout ' + tile.layout);
      }
    }
  }
  // Format
  if (is.inArray(this.options.formatOut, ['jpeg', 'png', 'webp'])) {
    this.options.tileFormat = this.options.formatOut;
  } else if (this.options.formatOut !== 'input') {
    throw new Error('Invalid tile format ' + this.options.formatOut);
  }
  return this._updateFormatOut('dz');
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
const _updateFormatOut = function _updateFormatOut (formatOut, options) {
  this.options.formatOut = (is.object(options) && options.force === false) ? 'input' : formatOut;
  return this;
};

/**
 * Update a Boolean attribute of the this.options Object.
 * @private
 * @param {String} key
 * @param {Boolean} val
 * @throws {Error} Invalid key
 */
const _setBooleanOption = function _setBooleanOption (key, val) {
  if (is.bool(val)) {
    this.options[key] = val;
  } else {
    throw new Error('Invalid ' + key + ' (boolean) ' + val);
  }
};

/**
 * Called by a WriteableStream to notify us it is ready for data.
 * @private
 */
const _read = function _read () {
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
const _pipeline = function _pipeline (callback) {
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
      if (this.streamInFinished) {
        this._flattenBufferIn();
        sharp.pipeline(this.options, function (err, data, info) {
          if (err) {
            that.emit('error', err);
          } else {
            that.emit('info', info);
            that.push(data);
          }
          that.push(null);
        });
      } else {
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
      }
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

// Deprecated output options
/* istanbul ignore next */
const quality = util.deprecate(function (quality) {
  const formatOut = this.options.formatOut;
  const options = { quality: quality };
  this.jpeg(options).webp(options).tiff(options);
  this.options.formatOut = formatOut;
  return this;
}, 'quality: use jpeg({ quality: ... }), webp({ quality: ... }) and/or tiff({ quality: ... }) instead');
/* istanbul ignore next */
const progressive = util.deprecate(function (progressive) {
  const formatOut = this.options.formatOut;
  const options = { progressive: (progressive !== false) };
  this.jpeg(options).png(options);
  this.options.formatOut = formatOut;
  return this;
}, 'progressive: use jpeg({ progressive: ... }) and/or png({ progressive: ... }) instead');
/* istanbul ignore next */
const compressionLevel = util.deprecate(function (compressionLevel) {
  const formatOut = this.options.formatOut;
  this.png({ compressionLevel: compressionLevel });
  this.options.formatOut = formatOut;
  return this;
}, 'compressionLevel: use png({ compressionLevel: ... }) instead');
/* istanbul ignore next */
const withoutAdaptiveFiltering = util.deprecate(function (withoutAdaptiveFiltering) {
  const formatOut = this.options.formatOut;
  this.png({ adaptiveFiltering: (withoutAdaptiveFiltering === false) });
  this.options.formatOut = formatOut;
  return this;
}, 'withoutAdaptiveFiltering: use png({ adaptiveFiltering: ... }) instead');
/* istanbul ignore next */
const withoutChromaSubsampling = util.deprecate(function (withoutChromaSubsampling) {
  const formatOut = this.options.formatOut;
  this.jpeg({ chromaSubsampling: (withoutChromaSubsampling === false) ? '4:2:0' : '4:4:4' });
  this.options.formatOut = formatOut;
  return this;
}, 'withoutChromaSubsampling: use jpeg({ chromaSubsampling: "4:4:4" }) instead');
/* istanbul ignore next */
const trellisQuantisation = util.deprecate(function (trellisQuantisation) {
  const formatOut = this.options.formatOut;
  this.jpeg({ trellisQuantisation: (trellisQuantisation !== false) });
  this.options.formatOut = formatOut;
  return this;
}, 'trellisQuantisation: use jpeg({ trellisQuantisation: ... }) instead');
/* istanbul ignore next */
const overshootDeringing = util.deprecate(function (overshootDeringing) {
  const formatOut = this.options.formatOut;
  this.jpeg({ overshootDeringing: (overshootDeringing !== false) });
  this.options.formatOut = formatOut;
  return this;
}, 'overshootDeringing: use jpeg({ overshootDeringing: ... }) instead');
/* istanbul ignore next */
const optimiseScans = util.deprecate(function (optimiseScans) {
  const formatOut = this.options.formatOut;
  this.jpeg({ optimiseScans: (optimiseScans !== false) });
  this.options.formatOut = formatOut;
  return this;
}, 'optimiseScans: use jpeg({ optimiseScans: ... }) instead');

/**
 * Decorate the Sharp prototype with output-related functions.
 * @private
 */
module.exports = function (Sharp) {
  [
    // Public
    toFile,
    toBuffer,
    withMetadata,
    jpeg,
    png,
    webp,
    tiff,
    raw,
    toFormat,
    tile,
    // Private
    _updateFormatOut,
    _setBooleanOption,
    _read,
    _pipeline
  ].forEach(function (f) {
    Sharp.prototype[f.name] = f;
  });
  // Deprecated
  Sharp.prototype.quality = quality;
  Sharp.prototype.progressive = progressive;
  Sharp.prototype.compressionLevel = compressionLevel;
  Sharp.prototype.withoutAdaptiveFiltering = withoutAdaptiveFiltering;
  Sharp.prototype.withoutChromaSubsampling = withoutChromaSubsampling;
  Sharp.prototype.trellisQuantisation = trellisQuantisation;
  Sharp.prototype.trellisQuantization = trellisQuantisation;
  Sharp.prototype.overshootDeringing = overshootDeringing;
  Sharp.prototype.optimiseScans = optimiseScans;
  Sharp.prototype.optimizeScans = optimiseScans;
};
