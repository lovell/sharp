'use strict';

const is = require('./is');
const sharp = require('../build/Release/sharp.node');

const formats = new Map([
  ['heic', 'heif'],
  ['heif', 'heif'],
  ['avif', 'avif'],
  ['jpeg', 'jpeg'],
  ['jpg', 'jpeg'],
  ['png', 'png'],
  ['raw', 'raw'],
  ['tiff', 'tiff'],
  ['webp', 'webp'],
  ['gif', 'gif']
]);

const errMagickSave = new Error('GIF output requires libvips with support for ImageMagick');

/**
 * Write output image data to a file.
 *
 * If an explicit output format is not selected, it will be inferred from the extension,
 * with JPEG, PNG, WebP, AVIF, TIFF, DZI, and libvips' V format supported.
 * Note that raw pixel data is only supported for buffer output.
 *
 * By default all metadata will be removed, which includes EXIF-based orientation.
 * See {@link withMetadata} for control over this.
 *
 * A `Promise` is returned when `callback` is not provided.
 *
 * @example
 * sharp(input)
 *   .toFile('output.png', (err, info) => { ... });
 *
 * @example
 * sharp(input)
 *   .toFile('output.png')
 *   .then(info => { ... })
 *   .catch(err => { ... });
 *
 * @param {string} fileOut - the path to write the image data to.
 * @param {Function} [callback] - called on completion with two arguments `(err, info)`.
 * `info` contains the output image `format`, `size` (bytes), `width`, `height`,
 * `channels` and `premultiplied` (indicating if premultiplication was used).
 * When using a crop strategy also contains `cropOffsetLeft` and `cropOffsetTop`.
 * @returns {Promise<Object>} - when no callback is provided
 * @throws {Error} Invalid parameters
 */
function toFile (fileOut, callback) {
  let err;
  if (!is.string(fileOut)) {
    err = new Error('Missing output file path');
  } else if (this.options.input.file === fileOut) {
    err = new Error('Cannot use same file for input and output');
  } else if (this.options.formatOut === 'input' && fileOut.toLowerCase().endsWith('.gif') && !this.constructor.format.magick.output.file) {
    err = errMagickSave;
  }
  if (err) {
    if (is.fn(callback)) {
      callback(err);
    } else {
      return Promise.reject(err);
    }
  } else {
    this.options.fileOut = fileOut;
    return this._pipeline(callback);
  }
  return this;
}

/**
 * Write output to a Buffer.
 * JPEG, PNG, WebP, AVIF, TIFF and raw pixel data output are supported.
 *
 * If no explicit format is set, the output format will match the input image, except GIF and SVG input which become PNG output.
 *
 * By default all metadata will be removed, which includes EXIF-based orientation.
 * See {@link withMetadata} for control over this.
 *
 * `callback`, if present, gets three arguments `(err, data, info)` where:
 * - `err` is an error, if any.
 * - `data` is the output image data.
 * - `info` contains the output image `format`, `size` (bytes), `width`, `height`,
 * `channels` and `premultiplied` (indicating if premultiplication was used).
 * When using a crop strategy also contains `cropOffsetLeft` and `cropOffsetTop`.
 *
 * A `Promise` is returned when `callback` is not provided.
 *
 * @example
 * sharp(input)
 *   .toBuffer((err, data, info) => { ... });
 *
 * @example
 * sharp(input)
 *   .toBuffer()
 *   .then(data => { ... })
 *   .catch(err => { ... });
 *
 * @example
 * sharp(input)
 *   .toBuffer({ resolveWithObject: true })
 *   .then(({ data, info }) => { ... })
 *   .catch(err => { ... });
 *
 * @example
 * const { data, info } = await sharp('my-image.jpg')
 *   // output the raw pixels
 *   .raw()
 *   .toBuffer({ resolveWithObject: true });
 *
 * // create a more type safe way to work with the raw pixel data
 * // this will not copy the data, instead it will change `data`s underlying ArrayBuffer
 * // so `data` and `pixelArray` point to the same memory location
 * const pixelArray = new Uint8ClampedArray(data.buffer);
 *
 * // When you are done changing the pixelArray, sharp takes the `pixelArray` as an input
 * const { width, height, channels } = info;
 * await sharp(pixelArray, { raw: { width, height, channels } })
 *   .toFile('my-changed-image.jpg');
 *
 * @param {Object} [options]
 * @param {boolean} [options.resolveWithObject] Resolve the Promise with an Object containing `data` and `info` properties instead of resolving only with `data`.
 * @param {Function} [callback]
 * @returns {Promise<Buffer>} - when no callback is provided
 */
function toBuffer (options, callback) {
  if (is.object(options)) {
    this._setBooleanOption('resolveWithObject', options.resolveWithObject);
  } else if (this.options.resolveWithObject) {
    this.options.resolveWithObject = false;
  }
  return this._pipeline(is.fn(options) ? options : callback);
}

/**
 * Include all metadata (EXIF, XMP, IPTC) from the input image in the output image.
 * This will also convert to and add a web-friendly sRGB ICC profile unless a custom
 * output profile is provided.
 *
 * The default behaviour, when `withMetadata` is not used, is to convert to the device-independent
 * sRGB colour space and strip all metadata, including the removal of any ICC profile.
 *
 * @example
 * sharp('input.jpg')
 *   .withMetadata()
 *   .toFile('output-with-metadata.jpg')
 *   .then(info => { ... });
 *
 * @example
 * // Set "IFD0-Copyright" in output EXIF metadata
 * await sharp(input)
 *   .withMetadata({
 *     exif: {
 *       IFD0: {
 *         Copyright: 'Wernham Hogg'
 *       }
 *     }
 *   })
 *   .toBuffer();
 *
 * @param {Object} [options]
 * @param {number} [options.orientation] value between 1 and 8, used to update the EXIF `Orientation` tag.
 * @param {string} [options.icc] filesystem path to output ICC profile, defaults to sRGB.
 * @param {Object<Object>} [options.exif={}] Object keyed by IFD0, IFD1 etc. of key/value string pairs to write as EXIF data.
 * @returns {Sharp}
 * @throws {Error} Invalid parameters
 */
function withMetadata (options) {
  this.options.withMetadata = is.bool(options) ? options : true;
  if (is.object(options)) {
    if (is.defined(options.orientation)) {
      if (is.integer(options.orientation) && is.inRange(options.orientation, 1, 8)) {
        this.options.withMetadataOrientation = options.orientation;
      } else {
        throw is.invalidParameterError('orientation', 'integer between 1 and 8', options.orientation);
      }
    }
    if (is.defined(options.icc)) {
      if (is.string(options.icc)) {
        this.options.withMetadataIcc = options.icc;
      } else {
        throw is.invalidParameterError('icc', 'string filesystem path to ICC profile', options.icc);
      }
    }
    if (is.defined(options.exif)) {
      if (is.object(options.exif)) {
        for (const [ifd, entries] of Object.entries(options.exif)) {
          if (is.object(entries)) {
            for (const [k, v] of Object.entries(entries)) {
              if (is.string(v)) {
                this.options.withMetadataStrs[`exif-${ifd.toLowerCase()}-${k}`] = v;
              } else {
                throw is.invalidParameterError(`exif.${ifd}.${k}`, 'string', v);
              }
            }
          } else {
            throw is.invalidParameterError(`exif.${ifd}`, 'object', entries);
          }
        }
      } else {
        throw is.invalidParameterError('exif', 'object', options.exif);
      }
    }
  }
  return this;
}

/**
 * Force output to a given format.
 *
 * @example
 * // Convert any input to PNG output
 * const data = await sharp(input)
 *   .toFormat('png')
 *   .toBuffer();
 *
 * @param {(string|Object)} format - as a string or an Object with an 'id' attribute
 * @param {Object} options - output options
 * @returns {Sharp}
 * @throws {Error} unsupported format or options
 */
function toFormat (format, options) {
  const actualFormat = formats.get((is.object(format) && is.string(format.id) ? format.id : format).toLowerCase());
  if (!actualFormat) {
    throw is.invalidParameterError('format', `one of: ${[...formats.keys()].join(', ')}`, format);
  }
  return this[actualFormat](options);
}

/**
 * Use these JPEG options for output image.
 *
 * @example
 * // Convert any input to very high quality JPEG output
 * const data = await sharp(input)
 *   .jpeg({
 *     quality: 100,
 *     chromaSubsampling: '4:4:4'
 *   })
 *   .toBuffer();
 *
 * @example
 * // Use mozjpeg to reduce output JPEG file size (slower)
 * const data = await sharp(input)
 *   .jpeg({ mozjpeg: true })
 *   .toBuffer();
 *
 * @param {Object} [options] - output options
 * @param {number} [options.quality=80] - quality, integer 1-100
 * @param {boolean} [options.progressive=false] - use progressive (interlace) scan
 * @param {string} [options.chromaSubsampling='4:2:0'] - set to '4:4:4' to prevent chroma subsampling otherwise defaults to '4:2:0' chroma subsampling
 * @param {boolean} [options.optimiseCoding=true] - optimise Huffman coding tables
 * @param {boolean} [options.optimizeCoding=true] - alternative spelling of optimiseCoding
 * @param {boolean} [options.mozjpeg=false] - use mozjpeg defaults, equivalent to `{ trellisQuantisation: true, overshootDeringing: true, optimiseScans: true, quantisationTable: 3 }`
 * @param {boolean} [options.trellisQuantisation=false] - apply trellis quantisation
 * @param {boolean} [options.overshootDeringing=false] - apply overshoot deringing
 * @param {boolean} [options.optimiseScans=false] - optimise progressive scans, forces progressive
 * @param {boolean} [options.optimizeScans=false] - alternative spelling of optimiseScans
 * @param {number} [options.quantisationTable=0] - quantization table to use, integer 0-8
 * @param {number} [options.quantizationTable=0] - alternative spelling of quantisationTable
 * @param {boolean} [options.force=true] - force JPEG output, otherwise attempt to use input format
 * @returns {Sharp}
 * @throws {Error} Invalid options
 */
function jpeg (options) {
  if (is.object(options)) {
    if (is.defined(options.quality)) {
      if (is.integer(options.quality) && is.inRange(options.quality, 1, 100)) {
        this.options.jpegQuality = options.quality;
      } else {
        throw is.invalidParameterError('quality', 'integer between 1 and 100', options.quality);
      }
    }
    if (is.defined(options.progressive)) {
      this._setBooleanOption('jpegProgressive', options.progressive);
    }
    if (is.defined(options.chromaSubsampling)) {
      if (is.string(options.chromaSubsampling) && is.inArray(options.chromaSubsampling, ['4:2:0', '4:4:4'])) {
        this.options.jpegChromaSubsampling = options.chromaSubsampling;
      } else {
        throw is.invalidParameterError('chromaSubsampling', 'one of: 4:2:0, 4:4:4', options.chromaSubsampling);
      }
    }
    const optimiseCoding = is.bool(options.optimizeCoding) ? options.optimizeCoding : options.optimiseCoding;
    if (is.defined(optimiseCoding)) {
      this._setBooleanOption('jpegOptimiseCoding', optimiseCoding);
    }
    if (is.defined(options.mozjpeg)) {
      if (is.bool(options.mozjpeg)) {
        if (options.mozjpeg) {
          this.options.jpegTrellisQuantisation = true;
          this.options.jpegOvershootDeringing = true;
          this.options.jpegOptimiseScans = true;
          this.options.jpegProgressive = true;
          this.options.jpegQuantisationTable = 3;
        }
      } else {
        throw is.invalidParameterError('mozjpeg', 'boolean', options.mozjpeg);
      }
    }
    const trellisQuantisation = is.bool(options.trellisQuantization) ? options.trellisQuantization : options.trellisQuantisation;
    if (is.defined(trellisQuantisation)) {
      this._setBooleanOption('jpegTrellisQuantisation', trellisQuantisation);
    }
    if (is.defined(options.overshootDeringing)) {
      this._setBooleanOption('jpegOvershootDeringing', options.overshootDeringing);
    }
    const optimiseScans = is.bool(options.optimizeScans) ? options.optimizeScans : options.optimiseScans;
    if (is.defined(optimiseScans)) {
      this._setBooleanOption('jpegOptimiseScans', optimiseScans);
      if (optimiseScans) {
        this.options.jpegProgressive = true;
      }
    }
    const quantisationTable = is.number(options.quantizationTable) ? options.quantizationTable : options.quantisationTable;
    if (is.defined(quantisationTable)) {
      if (is.integer(quantisationTable) && is.inRange(quantisationTable, 0, 8)) {
        this.options.jpegQuantisationTable = quantisationTable;
      } else {
        throw is.invalidParameterError('quantisationTable', 'integer between 0 and 8', quantisationTable);
      }
    }
  }
  return this._updateFormatOut('jpeg', options);
}

/**
 * Use these PNG options for output image.
 *
 * By default, PNG output is full colour at 8 or 16 bits per pixel.
 * Indexed PNG input at 1, 2 or 4 bits per pixel is converted to 8 bits per pixel.
 * Set `palette` to `true` for slower, indexed PNG output.
 *
 * @example
 * // Convert any input to full colour PNG output
 * const data = await sharp(input)
 *   .png()
 *   .toBuffer();
 *
 * @example
 * // Convert any input to indexed PNG output (slower)
 * const data = await sharp(input)
 *   .png({ palette: true })
 *   .toBuffer();
 *
 * @param {Object} [options]
 * @param {boolean} [options.progressive=false] - use progressive (interlace) scan
 * @param {number} [options.compressionLevel=6] - zlib compression level, 0 (fastest, largest) to 9 (slowest, smallest)
 * @param {boolean} [options.adaptiveFiltering=false] - use adaptive row filtering
 * @param {boolean} [options.palette=false] - quantise to a palette-based image with alpha transparency support
 * @param {number} [options.quality=100] - use the lowest number of colours needed to achieve given quality, sets `palette` to `true`
 * @param {number} [options.colours=256] - maximum number of palette entries, sets `palette` to `true`
 * @param {number} [options.colors=256] - alternative spelling of `options.colours`, sets `palette` to `true`
 * @param {number} [options.dither=1.0] - level of Floyd-Steinberg error diffusion, sets `palette` to `true`
 * @param {boolean} [options.force=true] - force PNG output, otherwise attempt to use input format
 * @returns {Sharp}
 * @throws {Error} Invalid options
 */
function png (options) {
  if (is.object(options)) {
    if (is.defined(options.progressive)) {
      this._setBooleanOption('pngProgressive', options.progressive);
    }
    if (is.defined(options.compressionLevel)) {
      if (is.integer(options.compressionLevel) && is.inRange(options.compressionLevel, 0, 9)) {
        this.options.pngCompressionLevel = options.compressionLevel;
      } else {
        throw is.invalidParameterError('compressionLevel', 'integer between 0 and 9', options.compressionLevel);
      }
    }
    if (is.defined(options.adaptiveFiltering)) {
      this._setBooleanOption('pngAdaptiveFiltering', options.adaptiveFiltering);
    }
    if (is.defined(options.palette)) {
      this._setBooleanOption('pngPalette', options.palette);
    } else if (is.defined(options.quality) || is.defined(options.colours || options.colors) || is.defined(options.dither)) {
      this._setBooleanOption('pngPalette', true);
    }
    if (this.options.pngPalette) {
      if (is.defined(options.quality)) {
        if (is.integer(options.quality) && is.inRange(options.quality, 0, 100)) {
          this.options.pngQuality = options.quality;
        } else {
          throw is.invalidParameterError('quality', 'integer between 0 and 100', options.quality);
        }
      }
      const colours = options.colours || options.colors;
      if (is.defined(colours)) {
        if (is.integer(colours) && is.inRange(colours, 2, 256)) {
          this.options.pngColours = colours;
        } else {
          throw is.invalidParameterError('colours', 'integer between 2 and 256', colours);
        }
      }
      if (is.defined(options.dither)) {
        if (is.number(options.dither) && is.inRange(options.dither, 0, 1)) {
          this.options.pngDither = options.dither;
        } else {
          throw is.invalidParameterError('dither', 'number between 0.0 and 1.0', options.dither);
        }
      }
    }
  }
  return this._updateFormatOut('png', options);
}

/**
 * Use these WebP options for output image.
 *
 * @example
 * // Convert any input to lossless WebP output
 * const data = await sharp(input)
 *   .webp({ lossless: true })
 *   .toBuffer();
 *
 * @example
 * // Optimise the file size of an animated WebP
 * const outputWebp = await sharp(inputWebp, { animated: true })
 *   .webp({ reductionEffort: 6 })
 *   .toBuffer();
 *
 * @param {Object} [options] - output options
 * @param {number} [options.quality=80] - quality, integer 1-100
 * @param {number} [options.alphaQuality=100] - quality of alpha layer, integer 0-100
 * @param {boolean} [options.lossless=false] - use lossless compression mode
 * @param {boolean} [options.nearLossless=false] - use near_lossless compression mode
 * @param {boolean} [options.smartSubsample=false] - use high quality chroma subsampling
 * @param {number} [options.reductionEffort=4] - level of CPU effort to reduce file size, integer 0-6
 * @param {number} [options.pageHeight] - page height for animated output
 * @param {number} [options.loop=0] - number of animation iterations, use 0 for infinite animation
 * @param {number[]} [options.delay] - list of delays between animation frames (in milliseconds)
 * @param {boolean} [options.force=true] - force WebP output, otherwise attempt to use input format
 * @returns {Sharp}
 * @throws {Error} Invalid options
 */
function webp (options) {
  if (is.object(options) && is.defined(options.quality)) {
    if (is.integer(options.quality) && is.inRange(options.quality, 1, 100)) {
      this.options.webpQuality = options.quality;
    } else {
      throw is.invalidParameterError('quality', 'integer between 1 and 100', options.quality);
    }
  }
  if (is.object(options) && is.defined(options.alphaQuality)) {
    if (is.integer(options.alphaQuality) && is.inRange(options.alphaQuality, 0, 100)) {
      this.options.webpAlphaQuality = options.alphaQuality;
    } else {
      throw is.invalidParameterError('alphaQuality', 'integer between 0 and 100', options.alphaQuality);
    }
  }
  if (is.object(options) && is.defined(options.lossless)) {
    this._setBooleanOption('webpLossless', options.lossless);
  }
  if (is.object(options) && is.defined(options.nearLossless)) {
    this._setBooleanOption('webpNearLossless', options.nearLossless);
  }
  if (is.object(options) && is.defined(options.smartSubsample)) {
    this._setBooleanOption('webpSmartSubsample', options.smartSubsample);
  }
  if (is.object(options) && is.defined(options.reductionEffort)) {
    if (is.integer(options.reductionEffort) && is.inRange(options.reductionEffort, 0, 6)) {
      this.options.webpReductionEffort = options.reductionEffort;
    } else {
      throw is.invalidParameterError('reductionEffort', 'integer between 0 and 6', options.reductionEffort);
    }
  }

  trySetAnimationOptions(options, this.options);
  return this._updateFormatOut('webp', options);
}

/**
 * Use these GIF options for output image.
 *
 * Requires libvips compiled with support for ImageMagick or GraphicsMagick.
 * The prebuilt binaries do not include this - see
 * {@link https://sharp.pixelplumbing.com/install#custom-libvips installing a custom libvips}.
 *
 * @param {Object} [options] - output options
 * @param {number} [options.pageHeight] - page height for animated output
 * @param {number} [options.loop=0] - number of animation iterations, use 0 for infinite animation
 * @param {number[]} [options.delay] - list of delays between animation frames (in milliseconds)
 * @param {boolean} [options.force=true] - force GIF output, otherwise attempt to use input format
 * @returns {Sharp}
 * @throws {Error} Invalid options
 */
/* istanbul ignore next */
function gif (options) {
  if (!this.constructor.format.magick.output.buffer) {
    throw errMagickSave;
  }
  trySetAnimationOptions(options, this.options);
  return this._updateFormatOut('gif', options);
}

/**
 * Set animation options if available.
 * @private
 *
 * @param {Object} [source] - output options
 * @param {number} [source.pageHeight] - page height for animated output
 * @param {number} [source.loop=0] - number of animation iterations, use 0 for infinite animation
 * @param {number[]} [source.delay] - list of delays between animation frames (in milliseconds)
 * @param {Object} [target] - target object for valid options
 * @throws {Error} Invalid options
 */
function trySetAnimationOptions (source, target) {
  if (is.object(source) && is.defined(source.pageHeight)) {
    if (is.integer(source.pageHeight) && source.pageHeight > 0) {
      target.pageHeight = source.pageHeight;
    } else {
      throw is.invalidParameterError('pageHeight', 'integer larger than 0', source.pageHeight);
    }
  }
  if (is.object(source) && is.defined(source.loop)) {
    if (is.integer(source.loop) && is.inRange(source.loop, 0, 65535)) {
      target.loop = source.loop;
    } else {
      throw is.invalidParameterError('loop', 'integer between 0 and 65535', source.loop);
    }
  }
  if (is.object(source) && is.defined(source.delay)) {
    if (
      Array.isArray(source.delay) &&
      source.delay.every(is.integer) &&
      source.delay.every(v => is.inRange(v, 0, 65535))) {
      target.delay = source.delay;
    } else {
      throw is.invalidParameterError('delay', 'array of integers between 0 and 65535', source.delay);
    }
  }
}

/**
 * Use these TIFF options for output image.
 *
 * @example
 * // Convert SVG input to LZW-compressed, 1 bit per pixel TIFF output
 * sharp('input.svg')
 *   .tiff({
 *     compression: 'lzw',
 *     bitdepth: 1
 *   })
 *   .toFile('1-bpp-output.tiff')
 *   .then(info => { ... });
 *
 * @param {Object} [options] - output options
 * @param {number} [options.quality=80] - quality, integer 1-100
 * @param {boolean} [options.force=true] - force TIFF output, otherwise attempt to use input format
 * @param {string} [options.compression='jpeg'] - compression options: lzw, deflate, jpeg, ccittfax4
 * @param {string} [options.predictor='horizontal'] - compression predictor options: none, horizontal, float
 * @param {boolean} [options.pyramid=false] - write an image pyramid
 * @param {boolean} [options.tile=false] - write a tiled tiff
 * @param {number} [options.tileWidth=256] - horizontal tile size
 * @param {number} [options.tileHeight=256] - vertical tile size
 * @param {number} [options.xres=1.0] - horizontal resolution in pixels/mm
 * @param {number} [options.yres=1.0] - vertical resolution in pixels/mm
 * @param {number} [options.bitdepth=8] - reduce bitdepth to 1, 2 or 4 bit
 * @returns {Sharp}
 * @throws {Error} Invalid options
 */
function tiff (options) {
  if (is.object(options)) {
    if (is.defined(options.quality)) {
      if (is.integer(options.quality) && is.inRange(options.quality, 1, 100)) {
        this.options.tiffQuality = options.quality;
      } else {
        throw is.invalidParameterError('quality', 'integer between 1 and 100', options.quality);
      }
    }
    if (is.defined(options.bitdepth)) {
      if (is.integer(options.bitdepth) && is.inArray(options.bitdepth, [1, 2, 4, 8])) {
        this.options.tiffBitdepth = options.bitdepth;
      } else {
        throw is.invalidParameterError('bitdepth', '1, 2, 4 or 8', options.bitdepth);
      }
    }
    // tiling
    if (is.defined(options.tile)) {
      this._setBooleanOption('tiffTile', options.tile);
    }
    if (is.defined(options.tileWidth)) {
      if (is.integer(options.tileWidth) && options.tileWidth > 0) {
        this.options.tiffTileWidth = options.tileWidth;
      } else {
        throw is.invalidParameterError('tileWidth', 'integer greater than zero', options.tileWidth);
      }
    }
    if (is.defined(options.tileHeight)) {
      if (is.integer(options.tileHeight) && options.tileHeight > 0) {
        this.options.tiffTileHeight = options.tileHeight;
      } else {
        throw is.invalidParameterError('tileHeight', 'integer greater than zero', options.tileHeight);
      }
    }
    // pyramid
    if (is.defined(options.pyramid)) {
      this._setBooleanOption('tiffPyramid', options.pyramid);
    }
    // resolution
    if (is.defined(options.xres)) {
      if (is.number(options.xres) && options.xres > 0) {
        this.options.tiffXres = options.xres;
      } else {
        throw is.invalidParameterError('xres', 'number greater than zero', options.xres);
      }
    }
    if (is.defined(options.yres)) {
      if (is.number(options.yres) && options.yres > 0) {
        this.options.tiffYres = options.yres;
      } else {
        throw is.invalidParameterError('yres', 'number greater than zero', options.yres);
      }
    }
    // compression
    if (is.defined(options.compression)) {
      if (is.string(options.compression) && is.inArray(options.compression, ['lzw', 'deflate', 'jpeg', 'ccittfax4', 'none'])) {
        this.options.tiffCompression = options.compression;
      } else {
        throw is.invalidParameterError('compression', 'one of: lzw, deflate, jpeg, ccittfax4, none', options.compression);
      }
    }
    // predictor
    if (is.defined(options.predictor)) {
      if (is.string(options.predictor) && is.inArray(options.predictor, ['none', 'horizontal', 'float'])) {
        this.options.tiffPredictor = options.predictor;
      } else {
        throw is.invalidParameterError('predictor', 'one of: none, horizontal, float', options.predictor);
      }
    }
  }
  return this._updateFormatOut('tiff', options);
}

/**
 * Use these AVIF options for output image.
 *
 * Whilst it is possible to create AVIF images smaller than 16x16 pixels,
 * most web browsers do not display these properly.
 *
 * @since 0.27.0
 *
 * @param {Object} [options] - output options
 * @param {number} [options.quality=50] - quality, integer 1-100
 * @param {boolean} [options.lossless=false] - use lossless compression
 * @param {number} [options.speed=5] - CPU effort vs file size, 0 (slowest/smallest) to 8 (fastest/largest)
 * @param {string} [options.chromaSubsampling='4:2:0'] - set to '4:4:4' to prevent chroma subsampling otherwise defaults to '4:2:0' chroma subsampling, requires libvips v8.11.0
 * @returns {Sharp}
 * @throws {Error} Invalid options
 */
function avif (options) {
  return this.heif({ ...options, compression: 'av1' });
}

/**
 * Use these HEIF options for output image.
 *
 * Support for patent-encumbered HEIC images requires the use of a
 * globally-installed libvips compiled with support for libheif, libde265 and x265.
 *
 * @since 0.23.0
 *
 * @param {Object} [options] - output options
 * @param {number} [options.quality=50] - quality, integer 1-100
 * @param {string} [options.compression='av1'] - compression format: av1, hevc
 * @param {boolean} [options.lossless=false] - use lossless compression
 * @param {number} [options.speed=5] - CPU effort vs file size, 0 (slowest/smallest) to 8 (fastest/largest)
 * @param {string} [options.chromaSubsampling='4:2:0'] - set to '4:4:4' to prevent chroma subsampling otherwise defaults to '4:2:0' chroma subsampling, requires libvips v8.11.0
 * @returns {Sharp}
 * @throws {Error} Invalid options
 */
function heif (options) {
  if (is.object(options)) {
    if (is.defined(options.quality)) {
      if (is.integer(options.quality) && is.inRange(options.quality, 1, 100)) {
        this.options.heifQuality = options.quality;
      } else {
        throw is.invalidParameterError('quality', 'integer between 1 and 100', options.quality);
      }
    }
    if (is.defined(options.lossless)) {
      if (is.bool(options.lossless)) {
        this.options.heifLossless = options.lossless;
      } else {
        throw is.invalidParameterError('lossless', 'boolean', options.lossless);
      }
    }
    if (is.defined(options.compression)) {
      if (is.string(options.compression) && is.inArray(options.compression, ['av1', 'hevc'])) {
        this.options.heifCompression = options.compression;
      } else {
        throw is.invalidParameterError('compression', 'one of: av1, hevc', options.compression);
      }
    }
    if (is.defined(options.speed)) {
      if (is.integer(options.speed) && is.inRange(options.speed, 0, 8)) {
        this.options.heifSpeed = options.speed;
      } else {
        throw is.invalidParameterError('speed', 'integer between 0 and 8', options.speed);
      }
    }
    if (is.defined(options.chromaSubsampling)) {
      if (is.string(options.chromaSubsampling) && is.inArray(options.chromaSubsampling, ['4:2:0', '4:4:4'])) {
        this.options.heifChromaSubsampling = options.chromaSubsampling;
      } else {
        throw is.invalidParameterError('chromaSubsampling', 'one of: 4:2:0, 4:4:4', options.chromaSubsampling);
      }
    }
  }
  return this._updateFormatOut('heif', options);
}

/**
 * Force output to be raw, uncompressed, 8-bit unsigned integer (unit8) pixel data.
 * Pixel ordering is left-to-right, top-to-bottom, without padding.
 * Channel ordering will be RGB or RGBA for non-greyscale colourspaces.
 *
 * @example
 * // Extract raw RGB pixel data from JPEG input
 * const { data, info } = await sharp('input.jpg')
 *   .raw()
 *   .toBuffer({ resolveWithObject: true });
 *
 * @example
 * // Extract alpha channel as raw pixel data from PNG input
 * const data = await sharp('input.png')
 *   .ensureAlpha()
 *   .extractChannel(3)
 *   .toColourspace('b-w')
 *   .raw()
 *   .toBuffer();
 *
 * @returns {Sharp}
 */
function raw () {
  return this._updateFormatOut('raw');
}

/**
 * Use tile-based deep zoom (image pyramid) output.
 * Set the format and options for tile images via the `toFormat`, `jpeg`, `png` or `webp` functions.
 * Use a `.zip` or `.szi` file extension with `toFile` to write to a compressed archive file format.
 *
 * Warning: multiple sharp instances concurrently producing tile output can expose a possible race condition in some versions of libgsf.
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
 * @param {Object} [options]
 * @param {number} [options.size=256] tile size in pixels, a value between 1 and 8192.
 * @param {number} [options.overlap=0] tile overlap in pixels, a value between 0 and 8192.
 * @param {number} [options.angle=0] tile angle of rotation, must be a multiple of 90.
 * @param {string|Object} [options.background={r: 255, g: 255, b: 255, alpha: 1}] - background colour, parsed by the [color](https://www.npmjs.org/package/color) module, defaults to white without transparency.
 * @param {string} [options.depth] how deep to make the pyramid, possible values are `onepixel`, `onetile` or `one`, default based on layout.
 * @param {number} [options.skipBlanks=-1] threshold to skip tile generation, a value 0 - 255 for 8-bit images or 0 - 65535 for 16-bit images
 * @param {string} [options.container='fs'] tile container, with value `fs` (filesystem) or `zip` (compressed file).
 * @param {string} [options.layout='dz'] filesystem layout, possible values are `dz`, `iiif`, `zoomify` or `google`.
 * @param {boolean} [options.centre=false] centre image in tile.
 * @param {boolean} [options.center=false] alternative spelling of centre.
 * @param {string} [options.id='https://example.com/iiif'] when `layout` is `iiif`, sets the `@id` attribute of `info.json`
 * @returns {Sharp}
 * @throws {Error} Invalid parameters
 */
function tile (options) {
  if (is.object(options)) {
    // Size of square tiles, in pixels
    if (is.defined(options.size)) {
      if (is.integer(options.size) && is.inRange(options.size, 1, 8192)) {
        this.options.tileSize = options.size;
      } else {
        throw is.invalidParameterError('size', 'integer between 1 and 8192', options.size);
      }
    }
    // Overlap of tiles, in pixels
    if (is.defined(options.overlap)) {
      if (is.integer(options.overlap) && is.inRange(options.overlap, 0, 8192)) {
        if (options.overlap > this.options.tileSize) {
          throw is.invalidParameterError('overlap', `<= size (${this.options.tileSize})`, options.overlap);
        }
        this.options.tileOverlap = options.overlap;
      } else {
        throw is.invalidParameterError('overlap', 'integer between 0 and 8192', options.overlap);
      }
    }
    // Container
    if (is.defined(options.container)) {
      if (is.string(options.container) && is.inArray(options.container, ['fs', 'zip'])) {
        this.options.tileContainer = options.container;
      } else {
        throw is.invalidParameterError('container', 'one of: fs, zip', options.container);
      }
    }
    // Layout
    if (is.defined(options.layout)) {
      if (is.string(options.layout) && is.inArray(options.layout, ['dz', 'google', 'iiif', 'zoomify'])) {
        this.options.tileLayout = options.layout;
      } else {
        throw is.invalidParameterError('layout', 'one of: dz, google, iiif, zoomify', options.layout);
      }
    }
    // Angle of rotation,
    if (is.defined(options.angle)) {
      if (is.integer(options.angle) && !(options.angle % 90)) {
        this.options.tileAngle = options.angle;
      } else {
        throw is.invalidParameterError('angle', 'positive/negative multiple of 90', options.angle);
      }
    }
    // Background colour
    this._setBackgroundColourOption('tileBackground', options.background);
    // Depth of tiles
    if (is.defined(options.depth)) {
      if (is.string(options.depth) && is.inArray(options.depth, ['onepixel', 'onetile', 'one'])) {
        this.options.tileDepth = options.depth;
      } else {
        throw is.invalidParameterError('depth', 'one of: onepixel, onetile, one', options.depth);
      }
    }
    // Threshold to skip blank tiles
    if (is.defined(options.skipBlanks)) {
      if (is.integer(options.skipBlanks) && is.inRange(options.skipBlanks, -1, 65535)) {
        this.options.tileSkipBlanks = options.skipBlanks;
      } else {
        throw is.invalidParameterError('skipBlanks', 'integer between -1 and 255/65535', options.skipBlanks);
      }
    } else if (is.defined(options.layout) && options.layout === 'google') {
      this.options.tileSkipBlanks = 5;
    }
    // Center image in tile
    const centre = is.bool(options.center) ? options.center : options.centre;
    if (is.defined(centre)) {
      this._setBooleanOption('tileCentre', centre);
    }
    // @id attribute for IIIF layout
    if (is.defined(options.id)) {
      if (is.string(options.id)) {
        this.options.tileId = options.id;
      } else {
        throw is.invalidParameterError('id', 'string', options.id);
      }
    }
  }
  // Format
  if (is.inArray(this.options.formatOut, ['jpeg', 'png', 'webp'])) {
    this.options.tileFormat = this.options.formatOut;
  } else if (this.options.formatOut !== 'input') {
    throw is.invalidParameterError('format', 'one of: jpeg, png, webp', this.options.formatOut);
  }
  return this._updateFormatOut('dz');
}

/**
 * Update the output format unless options.force is false,
 * in which case revert to input format.
 * @private
 * @param {string} formatOut
 * @param {Object} [options]
 * @param {boolean} [options.force=true] - force output format, otherwise attempt to use input format
 * @returns {Sharp}
 */
function _updateFormatOut (formatOut, options) {
  if (!(is.object(options) && options.force === false)) {
    this.options.formatOut = formatOut;
  }
  return this;
}

/**
 * Update a boolean attribute of the this.options Object.
 * @private
 * @param {string} key
 * @param {boolean} val
 * @throws {Error} Invalid key
 */
function _setBooleanOption (key, val) {
  if (is.bool(val)) {
    this.options[key] = val;
  } else {
    throw is.invalidParameterError(key, 'boolean', val);
  }
}

/**
 * Called by a WriteableStream to notify us it is ready for data.
 * @private
 */
function _read () {
  /* istanbul ignore else */
  if (!this.options.streamOut) {
    this.options.streamOut = true;
    this._pipeline();
  }
}

/**
 * Invoke the C++ image processing pipeline
 * Supports callback, stream and promise variants
 * @private
 */
function _pipeline (callback) {
  if (typeof callback === 'function') {
    // output=file/buffer
    if (this._isStreamInput()) {
      // output=file/buffer, input=stream
      this.on('finish', () => {
        this._flattenBufferIn();
        sharp.pipeline(this.options, callback);
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
      this.once('finish', () => {
        this._flattenBufferIn();
        sharp.pipeline(this.options, (err, data, info) => {
          if (err) {
            this.emit('error', err);
          } else {
            this.emit('info', info);
            this.push(data);
          }
          this.push(null);
        });
      });
      if (this.streamInFinished) {
        this.emit('finish');
      }
    } else {
      // output=stream, input=file/buffer
      sharp.pipeline(this.options, (err, data, info) => {
        if (err) {
          this.emit('error', err);
        } else {
          this.emit('info', info);
          this.push(data);
        }
        this.push(null);
      });
    }
    return this;
  } else {
    // output=promise
    if (this._isStreamInput()) {
      // output=promise, input=stream
      return new Promise((resolve, reject) => {
        this.once('finish', () => {
          this._flattenBufferIn();
          sharp.pipeline(this.options, (err, data, info) => {
            if (err) {
              reject(err);
            } else {
              if (this.options.resolveWithObject) {
                resolve({ data, info });
              } else {
                resolve(data);
              }
            }
          });
        });
      });
    } else {
      // output=promise, input=file/buffer
      return new Promise((resolve, reject) => {
        sharp.pipeline(this.options, (err, data, info) => {
          if (err) {
            reject(err);
          } else {
            if (this.options.resolveWithObject) {
              resolve({ data: data, info: info });
            } else {
              resolve(data);
            }
          }
        });
      });
    }
  }
}

/**
 * Decorate the Sharp prototype with output-related functions.
 * @private
 */
module.exports = function (Sharp) {
  Object.assign(Sharp.prototype, {
    // Public
    toFile,
    toBuffer,
    withMetadata,
    toFormat,
    jpeg,
    png,
    webp,
    tiff,
    avif,
    heif,
    gif,
    raw,
    tile,
    // Private
    _updateFormatOut,
    _setBooleanOption,
    _read,
    _pipeline
  });
};
