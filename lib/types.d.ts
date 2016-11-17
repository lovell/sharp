/**
 * @class Sharp
 *
 * Constructor factory to create an instance of `sharp`, to which further methods are chained.
 *
 * JPEG, PNG or WebP format image data can be streamed out from this object.
 * When using Stream based output, derived attributes are available from the `info` event.
 *
 * Implements the [stream.Duplex](http://nodejs.org/api/stream.html#stream_class_stream_duplex) class.
 *
 * @example
 * sharp('input.jpg')
 *   .resize(300, 200)
 *   .toFile('output.jpg', function(err) {
 *     // output.jpg is a 300 pixels wide and 200 pixels high image
 *     // containing a scaled and cropped version of input.jpg
 *   });
 *
 * @example
 * // Read image data from readableStream,
 * // resize to 300 pixels wide,
 * // emit an 'info' event with calculated dimensions
 * // and finally write image data to writableStream
 * var transformer = sharp()
 *   .resize(300)
 *   .on('info', function(info) {
 *     console.log('Image height is ' + info.height);
 *   });
 * readableStream.pipe(transformer).pipe(writableStream);
 *
 * @param {(Buffer|String)} [input] - if present, can be
 *  a Buffer containing JPEG, PNG, WebP, GIF, SVG, TIFF or raw pixel image data, or
 *  a String containing the path to an JPEG, PNG, WebP, GIF, SVG or TIFF image file.
 *  JPEG, PNG, WebP, GIF, SVG, TIFF or raw pixel image data can be streamed into the object when null or undefined.
 * @param {Object} [options] - if present, is an Object with optional attributes.
 * @param {Number} [options.density=72] - integral number representing the DPI for vector images.
 * @param {Object} [options.raw] - describes raw pixel image data. See `raw()` for pixel ordering.
 * @param {Number} [options.raw.width]
 * @param {Number} [options.raw.height]
 * @param {Number} [options.raw.channels]
 * @returns {Sharp}
 * @throws {Error} Invalid parameters
 */
declare class Sharp {
   /**
    * @class Sharp
    *
    * Constructor factory to create an instance of `sharp`, to which further methods are chained.
    *
    * JPEG, PNG or WebP format image data can be streamed out from this object.
    * When using Stream based output, derived attributes are available from the `info` event.
    *
    * Implements the [stream.Duplex](http://nodejs.org/api/stream.html#stream_class_stream_duplex) class.
    *
    * @example
    * sharp('input.jpg')
    *   .resize(300, 200)
    *   .toFile('output.jpg', function(err) {
    *     // output.jpg is a 300 pixels wide and 200 pixels high image
    *     // containing a scaled and cropped version of input.jpg
    *   });
    *
    * @example
    * // Read image data from readableStream,
    * // resize to 300 pixels wide,
    * // emit an 'info' event with calculated dimensions
    * // and finally write image data to writableStream
    * var transformer = sharp()
    *   .resize(300)
    *   .on('info', function(info) {
    *     console.log('Image height is ' + info.height);
    *   });
    * readableStream.pipe(transformer).pipe(writableStream);
    *
    * @param {(Buffer|String)} [input] - if present, can be
    *  a Buffer containing JPEG, PNG, WebP, GIF, SVG, TIFF or raw pixel image data, or
    *  a String containing the path to an JPEG, PNG, WebP, GIF, SVG or TIFF image file.
    *  JPEG, PNG, WebP, GIF, SVG, TIFF or raw pixel image data can be streamed into the object when null or undefined.
    * @param {Object} [options] - if present, is an Object with optional attributes.
    * @param {Number} [options.density=72] - integral number representing the DPI for vector images.
    * @param {Object} [options.raw] - describes raw pixel image data. See `raw()` for pixel ordering.
    * @param {Number} [options.raw.width]
    * @param {Number} [options.raw.height]
    * @param {Number} [options.raw.channels]
    * @returns {Sharp}
    * @throws {Error} Invalid parameters
    */
   constructor(input?: (Buffer|String), options?: { density: Number, raw: Object });

   /**
    * An Object containing nested boolean values representing the available input and output formats/methods.
    * @example
    * console.log(sharp.format());
    * @returns {Object}
    */
   static format: any;

   /**
    * An Object containing the version numbers of libvips and its dependencies.
    * @member
    * @example
    * console.log(sharp.versions);
    */
   static versions: any;

}

/**
 * Pixel limits.
 * @member
 * @private
 */
declare var maximum: any;

/**
 * An EventEmitter that emits a `change` event when a task is either:
 * - queued, waiting for _libuv_ to provide a worker thread
 * - complete
 * @member
 * @example
 * sharp.queue.on('change', function(queueLength) {
 *   console.log('Queue contains ' + queueLength + ' task(s)');
 * });
 */
declare var queue: any;

/**
 * Create Object containing input and input-related options.
 * @private
 */
declare function _createInputDescriptor(): void;

/**
 * Handle incoming Buffer chunk on Writable Stream.
 * @private
 * @param {Buffer} chunk
 * @param {String} encoding - unused
 * @param {Function} callback
 */
declare function _write(chunk: Buffer, encoding: String, callback: (() => any)): void;

/**
 * Flattens the array of chunks accumulated in input.buffer.
 * @private
 */
declare function _flattenBufferIn(): void;

/**
 * Are we expecting Stream-based input?
 * @private
 * @returns {Boolean}
 */
declare function _isStreamInput(): Boolean;

/**
 * Take a "snapshot" of the Sharp instance, returning a new instance.
 * Cloned instances inherit the input of their parent instance.
 * This allows multiple output Streams and therefore multiple processing pipelines to share a single input Stream.
 *
 * @example
 * const pipeline = sharp().rotate();
 * pipeline.clone().resize(800, 600).pipe(firstWritableStream);
 * pipeline.clone().extract({ left: 20, top: 20, width: 100, height: 100 }).pipe(secondWritableStream);
 * readableStream.pipe(pipeline);
 * // firstWritableStream receives auto-rotated, resized readableStream
 * // secondWritableStream receives auto-rotated, extracted region of readableStream
 *
 * @returns {Sharp}
 */
declare function clone(): Sharp;

/**
 * Fast access to image metadata without decoding any compressed image data.
 * A Promises/A+ promise is returned when `callback` is not provided.
 *
 * - `format`: Name of decoder used to decompress image data e.g. `jpeg`, `png`, `webp`, `gif`, `svg`
 * - `width`: Number of pixels wide
 * - `height`: Number of pixels high
 * - `space`: Name of colour space interpretation e.g. `srgb`, `rgb`, `cmyk`, `lab`, `b-w` [...](https://github.com/jcupitt/libvips/blob/master/libvips/iofuncs/enumtypes.c#L568)
 * - `channels`: Number of bands e.g. `3` for sRGB, `4` for CMYK
 * - `density`: Number of pixels per inch (DPI), if present
 * - `hasProfile`: Boolean indicating the presence of an embedded ICC profile
 * - `hasAlpha`: Boolean indicating the presence of an alpha transparency channel
 * - `orientation`: Number value of the EXIF Orientation header, if present
 * - `exif`: Buffer containing raw EXIF data, if present
 * - `icc`: Buffer containing raw [ICC](https://www.npmjs.com/package/icc) profile data, if present
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
 * @param {Function} [callback] - called with the arguments `(err, metadata)`
 * @returns {Promise<Object>|Sharp}
 */
declare function metadata(callback?: (() => any)): (Promise.<Object>|Sharp);

/**
 * Do not process input images where the number of pixels (width * height) exceeds this limit.
 * Assumes image dimensions contained in the input metadata can be trusted.
 * The default limit is 268402689 (0x3FFF * 0x3FFF) pixels.
 * @param {(Number|Boolean)} limit - an integral Number of pixels, zero or false to remove limit, true to use default limit.
 * @returns {Sharp}
 * @throws {Error} Invalid limit
 */
declare function limitInputPixels(limit: (Number|Boolean)): Sharp;

/**
 * An advanced setting that switches the libvips access method to `VIPS_ACCESS_SEQUENTIAL`.
 * This will reduce memory usage and can improve performance on some systems.
 * @param {Boolean} [sequentialRead=true]
 * @returns {Sharp}
 */
declare function sequentialRead(sequentialRead?: Boolean): Sharp;

/**
 * Weighting to apply to image crop.
 * @member
 * @private
 */
declare var gravity: any;

/**
 * Strategies for automagic crop behaviour.
 * @member
 * @private
 */
declare var strategy: any;

/**
 * Reduction kernels.
 * @member
 * @private
 */
declare var kernel: any;

/**
 * Enlargement interpolators.
 * @member
 * @private
 */
declare var interpolator: any;

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
declare function resize(width?: Number, height?: Number, options?: { kernel: String, interpolator: String, centreSampling: Boolean, centerSampling: Boolean }): Sharp;

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
declare function crop(crop?: String): Sharp;

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
 *   .background({r: 0, g: 0, b: 0, a: 0})
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
declare function embed(): Sharp;

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
declare function max(): Sharp;

/**
 * Preserving aspect ratio, resize the image to be as small as possible
 * while ensuring its dimensions are greater than or equal to the `width` and `height` specified.
 *
 * Both `width` and `height` must be provided via `resize` otherwise the behaviour will default to `crop`.
 *
 * @returns {Sharp}
 */
declare function min(): Sharp;

/**
 * Ignoring the aspect ratio of the input, stretch the image to
 * the exact `width` and/or `height` provided via `resize`.
 * @returns {Sharp}
 */
declare function ignoreAspectRatio(): Sharp;

/**
 * Do not enlarge the output image if the input image width *or* height are already less than the required dimensions.
 * This is equivalent to GraphicsMagick's `>` geometry option:
 * "*change the dimensions of the image only if its width or height exceeds the geometry specification*".
 * @param {Boolean} [withoutEnlargement=true]
 * @returns {Sharp}
 */
declare function withoutEnlargement(withoutEnlargement?: Boolean): Sharp;

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
declare function overlayWith(overlay: (Buffer|String), options?: { gravity: String, top: Number, left: Number, tile: Boolean, cutout: Boolean, raw: Object }): Sharp;

/**
 * Rotate the output image by either an explicit angle
 * or auto-orient based on the EXIF `Orientation` tag.
 *
 * Use this method without angle to determine the angle from EXIF data.
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
 * @param {Number} [angle=auto] 0, 90, 180 or 270.
 * @returns {Sharp}
 * @throws {Error} Invalid parameters
 */
declare function rotate(angle?: Number): Sharp;

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
declare function extract(options: { left: Number, top: Number, width: Number, height: Number }): Sharp;

/**
 * Flip the image about the vertical Y axis. This always occurs after rotation, if any.
 * The use of `flip` implies the removal of the EXIF `Orientation` tag, if any.
 * @param {Boolean} [flip=true]
 * @returns {Sharp}
 */
declare function flip(flip?: Boolean): Sharp;

/**
 * Flop the image about the horizontal X axis. This always occurs after rotation, if any.
 * The use of `flop` implies the removal of the EXIF `Orientation` tag, if any.
 * @param {Boolean} [flop=true]
 * @returns {Sharp}
 */
declare function flop(flop?: Boolean): Sharp;

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
declare function sharpen(sigma?: Number, flat?: Number, jagged?: Number): Sharp;

/**
 * Blur the image.
 * When used without parameters, performs a fast, mild blur of the output image.
 * When a `sigma` is provided, performs a slower, more accurate Gaussian blur.
 * @param {Number} [sigma] a value between 0.3 and 1000 representing the sigma of the Gaussian mask, where `sigma = 1 + radius / 2`.
 * @returns {Sharp}
 * @throws {Error} Invalid parameters
 */
declare function blur(sigma?: Number): Sharp;

/**
 * Extends/pads the edges of the image with the colour provided to the `background` method.
 * This operation will always occur after resizing and extraction, if any.
 *
 * @example
 * // Resize to 140 pixels wide, then add 10 transparent pixels
 * // to the top, left and right edges and 20 to the bottom edge
 * sharp(input)
 *   .resize(140)
 *   .background({r: 0, g: 0, b: 0, a: 0})
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
declare function extend(extend: (Number|{ top: Number, left: Number, bottom: Number, right: Number })): Sharp;

/**
 * Merge alpha transparency channel, if any, with `background`.
 * @param {Boolean} [flatten=true]
 * @returns {Sharp}
 */
declare function flatten(flatten?: Boolean): Sharp;

/**
 * Trim "boring" pixels from all edges that contain values within a percentage similarity of the top-left pixel.
 * @param {Number} [tolerance=10] value between 1 and 99 representing the percentage similarity.
 * @returns {Sharp}
 * @throws {Error} Invalid parameters
 */
declare function trim(tolerance?: Number): Sharp;

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
declare function gamma(gamma?: Number): Sharp;

/**
 * Produce the "negative" of the image.
 * @param {Boolean} [negate=true]
 * @returns {Sharp}
 */
declare function negate(negate?: Boolean): Sharp;

/**
 * Enhance output image contrast by stretching its luminance to cover the full dynamic range.
 * @param {Boolean} [normalise=true]
 * @returns {Sharp}
 */
declare function normalise(normalise?: Boolean): Sharp;

/**
 * Alternative spelling of normalise.
 * @param {Boolean} [normalize=true]
 * @returns {Sharp}
 */
declare function normalize(normalize?: Boolean): Sharp;

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
declare function convolve(kernel: { width: Number, height: Number, kernel: Number[], scale: Number, offset: Number }): Sharp;

/**
 * Any pixel value greather than or equal to the threshold value will be set to 255, otherwise it will be set to 0.
 * @param {Number} [threshold=128] - a value in the range 0-255 representing the level at which the threshold will be applied.
 * @param {Object} [options]
 * @param {Boolean} [options.greyscale=true] - convert to single channel greyscale.
 * @param {Boolean} [options.grayscale=true] - alternative spelling for greyscale.
 * @returns {Sharp}
 * @throws {Error} Invalid parameters
 */
declare function threshold(threshold?: Number, options?: { greyscale: Boolean, grayscale: Boolean }): Sharp;

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
declare function boolean(operand: (Buffer|String), operator: String, options?: { raw: Object }): Sharp;

/**
 * Colourspaces.
 * @private
 */
declare var colourspace: any;

/**
 * Set the background for the `embed`, `flatten` and `extend` operations.
 * The default background is `{r: 0, g: 0, b: 0, a: 1}`, black without transparency.
 *
 * Delegates to the _color_ module, which can throw an Error
 * but is liberal in what it accepts, clipping values to sensible min/max.
 * The alpha value is a float between `0` (transparent) and `1` (opaque).
 *
 * @param {String|Object} rgba - parsed by the [color](https://www.npmjs.org/package/color) module to extract values for red, green, blue and alpha.
 * @returns {Sharp}
 * @throws {Error} Invalid parameter
 */
declare function background(rgba: (String|Object)): Sharp;

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
declare function greyscale(greyscale?: Boolean): Sharp;

/**
 * Alternative spelling of `greyscale`.
 * @param {Boolean} [grayscale=true]
 * @returns {Sharp}
 */
declare function grayscale(grayscale?: Boolean): Sharp;

/**
 * Set the output colourspace.
 * By default output image will be web-friendly sRGB, with additional channels interpreted as alpha channels.
 * @param {String} [colourspace] - output colourspace e.g. `srgb`, `rgb`, `cmyk`, `lab`, `b-w` [...](https://github.com/jcupitt/libvips/blob/master/libvips/iofuncs/enumtypes.c#L568)
 * @returns {Sharp}
 * @throws {Error} Invalid parameters
 */
declare function toColourspace(colourspace?: String): Sharp;

/**
 * Alternative spelling of `toColourspace`.
 * @param {String} [colorspace] - output colorspace.
 * @returns {Sharp}
 * @throws {Error} Invalid parameters
 */
declare function toColorspace(colorspace?: String): Sharp;

/**
 * Boolean operations for bandbool.
 * @private
 */
declare var bool: any;

/**
 * Extract a single channel from a multi-channel image.
 *
 * @example
 * sharp(input)
 *   .extractChannel('green')
 *   .toFile('input_green.jpg', function(err, info) {
 *     // info.channels === 1
 *     // input_green.jpg contains the green channel of the input image
 *    });
 *
 * @param {Number|String} channel - zero-indexed band number to extract, or `red`, `green` or `blue` as alternative to `0`, `1` or `2` respectively.
 * @returns {Sharp}
 * @throws {Error} Invalid channel
 */
declare function extractChannel(channel: (Number|String)): Sharp;

/**
 * Join one or more channels to the image.
 * The meaning of the added channels depends on the output colourspace, set with `toColourspace()`.
 * By default the output image will be web-friendly sRGB, with additional channels interpreted as alpha channels.
 * Channel ordering follows vips convention:
 * - sRGB: 0: Red, 1: Green, 2: Blue, 3: Alpha.
 * - CMYK: 0: Magenta, 1: Cyan, 2: Yellow, 3: Black, 4: Alpha.
 *
 * Buffers may be any of the image formats supported by sharp: JPEG, PNG, WebP, GIF, SVG, TIFF or raw pixel image data.
 * For raw pixel input, the `options` object should contain a `raw` attribute, which follows the format of the attribute of the same name in the `sharp()` constructor.
 *
 * @param {Array<String|Buffer>|String|Buffer} images - one or more images (file paths, Buffers).
 * @param {Object} options - image options, see `sharp()` constructor.
 * @returns {Sharp}
 * @throws {Error} Invalid parameters
 */
declare function joinChannel(images: ((String|Buffer)[]|String|Buffer), options: Object): Sharp;

/**
 * Perform a bitwise boolean operation on all input image channels (bands) to produce a single channel output image.
 *
 * @example
 * sharp('3-channel-rgb-input.png')
 *   .bandbool(sharp.bool.and)
 *   .toFile('1-channel-output.png', function (err, info) {
 *     // The output will be a single channel image where each pixel `P = R & G & B`.
 *     // If `I(1,1) = [247, 170, 14] = [0b11110111, 0b10101010, 0b00001111]`
 *     // then `O(1,1) = 0b11110111 & 0b10101010 & 0b00001111 = 0b00000010 = 2`.
 *   });
 *
 * @param {String} boolOp - one of `and`, `or` or `eor` to perform that bitwise operation, like the C logic operators `&`, `|` and `^` respectively.
 * @returns {Sharp}
 * @throws {Error} Invalid parameters
 */
declare function bandbool(boolOp: String): Sharp;

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
declare function toFile(fileOut: String, callback?: (() => any)): Promise.<Object>;

/**
 * Write output to a Buffer.
 * By default, the format will match the input image. JPEG, PNG, WebP, and RAW are supported.
 * `callback`, if present, gets three arguments `(err, buffer, info)` where:
 * - `err` is an error message, if any.
 * - `buffer` is the output image data.
 * - `info` contains the output image `format`, `size` (bytes), `width`, `height` and `channels`.
 * A Promises/A+ promise is returned when `callback` is not provided.
 *
 * @param {Function} [callback]
 * @returns {Promise<Buffer>} - when no callback is provided
 */
declare function toBuffer(callback?: (() => any)): Promise.<Buffer>;

/**
 * Include all metadata (EXIF, XMP, IPTC) from the input image in the output image.
 * The default behaviour, when `withMetadata` is not used, is to strip all metadata and convert to the device-independent sRGB colour space.
 * This will also convert to and add a web-friendly sRGB ICC profile.
 * @param {Object} [withMetadata]
 * @param {Number} [withMetadata.orientation] value between 1 and 8, used to update the EXIF `Orientation` tag.
 * @returns {Sharp}
 * @throws {Error} Invalid parameters
 */
declare function withMetadata(withMetadata?: { orientation: Number }): Sharp;

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
declare function jpeg(options?: { quality: Number, progressive: Boolean, chromaSubsampling: String, trellisQuantisation: Boolean, overshootDeringing: Boolean, optimiseScans: Boolean, optimizeScans: Boolean, force: Boolean }): Sharp;

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
declare function png(options?: { progressive: Boolean, compressionLevel: Number, adaptiveFiltering: Boolean, force: Boolean }): Sharp;

/**
 * Use these WebP options for output image.
 * @param {Object} [options] - output options
 * @param {Number} [options.quality=80] - quality, integer 1-100
 * @param {Boolean} [options.force=true] - force WebP output, otherwise attempt to use input format
 * @returns {Sharp}
 * @throws {Error} Invalid options
 */
declare function webp(options?: { quality: Number, force: Boolean }): Sharp;

/**
 * Use these TIFF options for output image.
 * @param {Object} [options] - output options
 * @param {Number} [options.quality=80] - quality, integer 1-100
 * @param {Boolean} [options.force=true] - force TIFF output, otherwise attempt to use input format
 * @returns {Sharp}
 * @throws {Error} Invalid options
 */
declare function tiff(options?: { quality: Number, force: Boolean }): Sharp;

/**
 * Force output to be raw, uncompressed uint8 pixel data.
 * @returns {Sharp}
 */
declare function raw(): Sharp;

/**
 * Force output to a given format.
 * @param {(String|Object)} format - as a String or an Object with an 'id' attribute
 * @param {Object} options - output options
 * @returns {Sharp}
 * @throws {Error} unsupported format or options
 */
declare function toFormat(format: (String|Object), options: Object): Sharp;

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
declare function tile(tile?: { size: Number, overlap: Number, container: String, layout: String }): Sharp;

/**
 * Update the output format unless options.force is false,
 * in which case revert to input format.
 * @private
 * @param {String} formatOut
 * @param {Object} [options]
 * @param {Boolean} [options.force=true] - force output format, otherwise attempt to use input format
 * @returns {Sharp}
 */
declare function _updateFormatOut(formatOut: String, options?: { force: Boolean }): Sharp;

/**
 * Update a Boolean attribute of the this.options Object.
 * @private
 * @param {String} key
 * @param {Boolean} val
 * @throws {Error} Invalid key
 */
declare function _setBooleanOption(key: String, val: Boolean): void;

/**
 * Called by a WriteableStream to notify us it is ready for data.
 * @private
 */
declare function _read(): void;

/**
 * Invoke the C++ image processing pipeline
 * Supports callback, stream and promise variants
 * @private
 */
declare function _pipeline(): void;

/**
 * Gets, or when options are provided sets, the limits of _libvips'_ operation cache.
 * Existing entries in the cache will be trimmed after any change in limits.
 * This method always returns cache statistics,
 * useful for determining how much working memory is required for a particular task.
 *
 * @example
 * const stats = sharp.cache();
 * @example
 * sharp.cache( { items: 200 } );
 * sharp.cache( { files: 0 } );
 * sharp.cache(false);
 *
 * @param {Object|Boolean} options - Object with the following attributes, or Boolean where true uses default cache settings and false removes all caching.
 * @param {Number} [options.memory=50] - is the maximum memory in MB to use for this cache
 * @param {Number} [options.files=20] - is the maximum number of files to hold open
 * @param {Number} [options.items=100] - is the maximum number of operations to cache
 * @returns {Object}
 */
declare function cache(options: ({ memory: Number, files: Number, items: Number }|Boolean)): Object;

/**
 * Gets, or when a concurrency is provided sets,
 * the number of threads _libvips'_ should create to process each image.
 * The default value is the number of CPU cores.
 * A value of `0` will reset to this default.
 *
 * The maximum number of images that can be processed in parallel
 * is limited by libuv's `UV_THREADPOOL_SIZE` environment variable.
 *
 * This method always returns the current concurrency.
 *
 * @example
 * const threads = sharp.concurrency(); // 4
 * sharp.concurrency(2); // 2
 * sharp.concurrency(0); // 4
 *
 * @param {Number} [concurrency]
 * @returns {Number} concurrency
 */
declare function concurrency(concurrency?: Number): Number;

/**
 * Provides access to internal task counters.
 * - queue is the number of tasks this module has queued waiting for _libuv_ to provide a worker thread from its pool.
 * - process is the number of resize tasks currently being processed.
 *
 * @example
 * const counters = sharp.counters(); // { queue: 2, process: 4 }
 *
 * @returns {Object}
 */
declare function counters(): Object;

/**
 * Get and set use of SIMD vector unit instructions.
 * Requires libvips to have been compiled with liborc support.
 *
 * Improves the performance of `resize`, `blur` and `sharpen` operations
 * by taking advantage of the SIMD vector unit of the CPU, e.g. Intel SSE and ARM NEON.
 *
 * This feature is currently off by default but future versions may reverse this.
 * Versions of liborc prior to 0.4.25 are known to segfault under heavy load.
 *
 * @example
 * const simd = sharp.simd();
 * // simd is `true` if SIMD is currently enabled
 * @example
 * const simd = sharp.simd(true);
 * // attempts to enable the use of SIMD, returning true if available
 *
 * @param {Boolean} [simd=false]
 * @returns {Boolean}
 */
declare function simd(simd?: Boolean): Boolean;

