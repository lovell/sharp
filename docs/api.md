# API

```javascript
var sharp = require('sharp');
```

### Input

#### sharp([input], [options])

Constructor to which further methods are chained.

`input`, if present, can be one of:

* Buffer containing JPEG, PNG, WebP, GIF, SVG, TIFF or raw pixel image data, or
* String containing the path to an image file, with most major formats supported.

JPEG, PNG, WebP, GIF, SVG, TIFF or raw pixel image data
can be streamed into the object when `input` is `null` or `undefined`.

`options`, if present, is an Object with the following optional attributes:

* `density` an integral number representing the DPI for vector images, defaulting to 72.
* `raw` an Object containing `width`, `height` and `channels` when providing uncompressed data. See `raw()` for pixel ordering.

The object returned by the constructor implements the
[stream.Duplex](http://nodejs.org/api/stream.html#stream_class_stream_duplex) class.

JPEG, PNG or WebP format image data can be streamed out from this object.

```javascript
sharp('input.jpg')
  .resize(300, 200)
  .toFile('output.jpg', function(err) {
    // output.jpg is a 300 pixels wide and 200 pixels high image
    // containing a scaled and cropped version of input.jpg
  });
```

#### metadata([callback])

Fast access to image metadata without decoding any compressed image data.

`callback`, if present, gets the arguments `(err, metadata)` where `metadata` has the attributes:

* `format`: Name of decoder to be used to decompress image data e.g. `jpeg`, `png`, `webp` (for file-based input additionally `tiff`, `magick`, `openslide`, `ppm`, `fits`)
* `width`: Number of pixels wide
* `height`: Number of pixels high
* `space`: Name of colour space interpretation e.g. `srgb`, `rgb`, `scrgb`, `cmyk`, `lab`, `xyz`, `b-w` [...](https://github.com/jcupitt/libvips/blob/master/libvips/iofuncs/enumtypes.c#L522)
* `channels`: Number of bands e.g. `3` for sRGB, `4` for CMYK
* `hasProfile`: Boolean indicating the presence of an embedded ICC profile
* `hasAlpha`: Boolean indicating the presence of an alpha transparency channel
* `orientation`: Number value of the EXIF Orientation header, if present
* `exif`: Buffer containing raw EXIF data, if present
* `icc`: Buffer containing raw [ICC](https://www.npmjs.com/package/icc) profile data, if present

A Promises/A+ promise is returned when `callback` is not provided.

```javascript
var image = sharp(inputJpg);
image
  .metadata()
  .then(function(metadata) {
    return image
      .resize(Math.round(metadata.width / 2))
      .webp()
      .toBuffer();
  })
  .then(function(data) {
    // data contains a WebP image half the width and height of the original JPEG
  });
```

#### clone()

Takes a "snapshot" of the instance, returning a new instance.
Cloned instances inherit the input of their parent instance.

This allows multiple output Streams
and therefore multiple processing pipelines
to share a single input Stream.

```javascript
var pipeline = sharp().rotate();
pipeline.clone().resize(800, 600).pipe(firstWritableStream);
pipeline.clone().extract({ left: 20, top: 20, width: 100, height: 100 }).pipe(secondWritableStream);
readableStream.pipe(pipeline);
// firstWritableStream receives auto-rotated, resized readableStream
// secondWritableStream receives auto-rotated, extracted region of readableStream
```

#### sequentialRead()

An advanced setting that switches the libvips access method to `VIPS_ACCESS_SEQUENTIAL`.
This will reduce memory usage and can improve performance on some systems.

#### limitInputPixels(pixels)

Do not process input images where the number of pixels (width * height) exceeds this limit.

`pixels` is the integral Number of pixels, with a value between 1 and the default 268402689 (0x3FFF * 0x3FFF).

### Resizing

#### resize([width], [height])

Scale output to `width` x `height`. By default, the resized image is cropped to the exact size specified.

`width` is the integral Number of pixels wide the resultant image should be, between 1 and 16383 (0x3FFF). Use `null` or `undefined` to auto-scale the width to match the height.

`height` is the integral Number of pixels high the resultant image should be, between 1 and 16383. Use `null` or `undefined` to auto-scale the height to match the width.

#### crop([gravity])

Crop the resized image to the exact size specified, the default behaviour.

`gravity`, if present, is a String or an attribute of the `sharp.gravity` Object e.g. `sharp.gravity.north`.

Possible values are `north`, `northeast`, `east`, `southeast`, `south`, `southwest`, `west`, `northwest`, `center` and `centre`.
The default gravity is `center`/`centre`.

```javascript
var transformer = sharp()
  .resize(300, 200)
  .crop(sharp.gravity.north)
  .on('error', function(err) {
    console.log(err);
  });
// Read image data from readableStream, resize and write image data to writableStream
readableStream.pipe(transformer).pipe(writableStream);
```

#### embed()

Preserving aspect ratio, resize the image to the
maximum `width` or `height` specified
then embed on a background of the exact
`width` and `height` specified.

If the background contains an alpha value
then WebP and PNG format output images will
contain an alpha channel,
even when the input image does not.

```javascript
sharp('input.gif')
  .resize(200, 300)
  .background({r: 0, g: 0, b: 0, a: 0})
  .embed()
  .toFormat(sharp.format.webp)
  .toBuffer(function(err, outputBuffer) {
    if (err) {
      throw err;
    }
    // outputBuffer contains WebP image data of a 200 pixels wide and 300 pixels high
    // containing a scaled version, embedded on a transparent canvas, of input.gif
  });
```

#### max()

Preserving aspect ratio,
resize the image to be as large as possible
while ensuring its dimensions are less than or equal to
the `width` and `height` specified.

Both `width` and `height` must be provided via
`resize` otherwise the behaviour will default to `crop`.

```javascript
sharp(inputBuffer)
  .resize(200, 200)
  .max()
  .toFormat('jpeg')
  .toBuffer()
  .then(function(outputBuffer) {
    // outputBuffer contains JPEG image data no wider than 200 pixels and no higher
    // than 200 pixels regardless of the inputBuffer image dimensions
  });
```

#### min()

Preserving aspect ratio,
resize the image to be as small as possible
while ensuring its dimensions are greater than or equal to
the `width` and `height` specified.

Both `width` and `height` must be provided via `resize` otherwise the behaviour will default to `crop`.

#### withoutEnlargement()

Do not enlarge the output image
if the input image width *or* height
are already less than the required dimensions.

This is equivalent to GraphicsMagick's `>` geometry option:
"*change the dimensions of the image only
if its width or height exceeds the geometry specification*".

#### ignoreAspectRatio()

Ignoring the aspect ratio of the input, stretch the image to the exact `width` and/or `height` provided via `resize`.

#### interpolateWith(interpolator)

Use the given interpolator for image resizing, where `interpolator` is an attribute of the `sharp.interpolator` Object e.g. `sharp.interpolator.bicubic`.

The default interpolator is `bicubic`, providing a general-purpose interpolator that is both fast and of good quality.

Possible interpolators, in order of performance, are:

* `nearest`: Use [nearest neighbour interpolation](http://en.wikipedia.org/wiki/Nearest-neighbor_interpolation), suitable for image enlargement only.
* `bilinear`: Use [bilinear interpolation](http://en.wikipedia.org/wiki/Bilinear_interpolation), faster than bicubic but with less smooth results.
* `vertexSplitQuadraticBasisSpline`: Use the smoother [VSQBS interpolation](https://github.com/jcupitt/libvips/blob/master/libvips/resample/vsqbs.cpp#L48) to prevent "staircasing" when enlarging.
* `bicubic`: Use [bicubic interpolation](http://en.wikipedia.org/wiki/Bicubic_interpolation) (the default).
* `locallyBoundedBicubic`: Use [LBB interpolation](https://github.com/jcupitt/libvips/blob/master/libvips/resample/lbb.cpp#L100), which prevents some "[acutance](http://en.wikipedia.org/wiki/Acutance)" but typically reduces performance by a factor of 2.
* `nohalo`: Use [Nohalo interpolation](http://eprints.soton.ac.uk/268086/), which prevents acutance but typically reduces performance by a factor of 3.

[Compare the output of these interpolators](https://github.com/lovell/sharp/tree/master/test/interpolators)

```javascript
sharp(inputBuffer)
  .resize(200, 300)
  .interpolateWith(sharp.interpolator.nohalo)
  .background('white')
  .embed()
  .toFile('output.tiff')
  .then(function() {
    // output.tiff is a 200 pixels wide and 300 pixels high image
    // containing a nohalo scaled version, embedded on a white canvas,
    // of the image data in inputBuffer
  });
```

### Operations

#### extract({ left: left, top: top, width: width, height: height })

Extract a region of the image. Can be used with or without a `resize` operation.

`left` and `top` are the offset, in pixels, from the top-left corner.

`width` and `height` are the dimensions of the extracted image.

Use `extract` before `resize` for pre-resize extraction. Use `extract` after `resize` for post-resize extraction. Use `extract` before and after for both.

```javascript
sharp(input)
  .extract({ left: left, top: top, width: width, height: height })
  .toFile(output, function(err) {
    // Extract a region of the input image, saving in the same format.
  });
```

```javascript
sharp(input)
  .extract({ left: leftOffsetPre, top: topOffsetPre, width: widthPre, height: heightPre })
  .resize(width, height)
  .extract({ left: leftOffsetPost, top: topOffsetPost, width: widthPost, height: heightPost })
  .toFile(output, function(err) {
    // Extract a region, resize, then extract from the resized image
  });
```

#### background(rgba)

Set the background for the `embed` and `flatten` operations.

`rgba` is parsed by the [color](https://www.npmjs.org/package/color) module to extract values for red, green, blue and alpha.

The alpha value is a float between `0` (transparent) and `1` (opaque).

The default background is `{r: 0, g: 0, b: 0, a: 1}`, black without transparency.

#### flatten()

Merge alpha transparency channel, if any, with `background`.

#### negate()

Produces the "negative" of the image.  White => Black, Black => White, Blue => Yellow, etc.

#### rotate([angle])

Rotate the output image by either an explicit angle or auto-orient based on the EXIF `Orientation` tag.

`angle`, if present, is a Number with a value of `0`, `90`, `180` or `270`.

Use this method without `angle` to determine the angle from EXIF data. Mirroring is supported and may infer the use of a `flip` operation.

Method order is important when both rotating and extracting regions, for example `rotate(x).extract(y)` will produce a different result to `extract(y).rotate(x)`.

The use of `rotate` implies the removal of the EXIF `Orientation` tag, if any.

```javascript
var pipeline = sharp()
  .rotate()
  .resize(null, 200)
  .progressive()
  .toBuffer(function(err, outputBuffer, info) {
    if (err) {
      throw err;
    }
    // outputBuffer contains 200px high progressive JPEG image data,
    // auto-rotated using EXIF Orientation tag
    // info.width and info.height contain the dimensions of the resized image
  });
readableStream.pipe(pipeline);
```

#### flip()

Flip the image about the vertical Y axis. This always occurs after rotation, if any.
The use of `flip` implies the removal of the EXIF `Orientation` tag, if any.

#### flop()

Flop the image about the horizontal X axis. This always occurs after rotation, if any.
The use of `flop` implies the removal of the EXIF `Orientation` tag, if any.

#### blur([sigma])

When used without parameters, performs a fast, mild blur of the output image. This typically reduces performance by 10%.

When a `sigma` is provided, performs a slower, more accurate Gaussian blur. This typically reduces performance by 25%.

* `sigma`, if present, is a Number between 0.3 and 1000 representing the approximate blur radius in pixels.

#### sharpen([radius], [flat], [jagged])

When used without parameters, performs a fast, mild sharpen of the output image. This typically reduces performance by 10%.

When a `radius` is provided, performs a slower, more accurate sharpen of the L channel in the LAB colour space. Separate control over the level of sharpening in "flat" and "jagged" areas is available. This typically reduces performance by 50%.

* `radius`, if present, is an integral Number representing the sharpen mask radius in pixels.
* `flat`, if present, is a Number representing the level of sharpening to apply to "flat" areas, defaulting to a value of 1.0.
* `jagged`, if present, is a Number representing the level of sharpening to apply to "jagged" areas, defaulting to a value of 2.0.

#### threshold([threshold])

Converts all pixels in the image to greyscale white or black.  Any pixel greather-than-or-equal-to the threshold (0..255) will be white.  All others will be black.

* `threshold`, if present, is a Number, representing the level above which pixels will be forced to white.

#### gamma([gamma])

Apply a gamma correction by reducing the encoding (darken) pre-resize at a factor of `1/gamma` then increasing the encoding (brighten) post-resize at a factor of `gamma`.

`gamma`, if present, is a Number between 1 and 3. The default value is `2.2`, a suitable approximation for sRGB images.

This can improve the perceived brightness of a resized image in non-linear colour spaces.

JPEG input images will not take advantage of the shrink-on-load performance optimisation when applying a gamma correction.

#### grayscale() / greyscale()

Convert to 8-bit greyscale; 256 shades of grey.

This is a linear operation. If the input image is in a non-linear colour space such as sRGB, use `gamma()` with `greyscale()` for the best results.

The output image will still be web-friendly sRGB and contain three (identical) channels.

#### normalize() / normalise()

Enhance output image contrast by stretching its luminance to cover the full dynamic range. This typically reduces performance by 30%.

#### overlayWith(path)

_Experimental_

Alpha composite image at `path` over the processed (resized, extracted) image. The dimensions of the two images must match.

* `path` is a String containing the path to an image file with an alpha channel.

```javascript
sharp('input.png')
  .rotate(180)
  .resize(300)
  .flatten()
  .background('#ff6600')
  .overlayWith('overlay.png')
  .sharpen()
  .withMetadata()
  .quality(90)
  .webp()
  .toBuffer()
  .then(function(outputBuffer) {
    // outputBuffer contains upside down, 300px wide, alpha channel flattened
    // onto orange background, composited with overlay.png, sharpened,
    // with metadata, 90% quality WebP image data. Phew!
  });
```

### Output

#### toFile(path, [callback])

`path` is a String containing the path to write the image data to.

If an explicit output format is not selected, it will be inferred from the extension, with JPEG, PNG, WebP, TIFF and DZI supported.

`callback`, if present, is called with two arguments `(err, info)` where:

* `err` contains an error message, if any.
* `info` contains the output image `format`, `size` (bytes), `width`, `height` and `channels`.

A Promises/A+ promise is returned when `callback` is not provided.

#### toBuffer([callback])

Write image data to a Buffer, the format of which will match the input image by default. JPEG, PNG and WebP are supported.

`callback`, if present, gets three arguments `(err, buffer, info)` where:

* `err` is an error message, if any.
* `buffer` is the output image data.
* `info` contains the output image `format`, `size` (bytes), `width`, `height` and `channels`.

A Promises/A+ promise is returned when `callback` is not provided.

#### jpeg()

Use JPEG format for the output image.

#### png()

Use PNG format for the output image.

#### webp()

Use WebP format for the output image.

#### raw()

Provide raw, uncompressed uint8 (unsigned char) image data for Buffer and Stream based output.

The number of channels depends on the input image and selected options.

* 1 channel for images converted to `greyscale()`, with each byte representing one pixel.
* 3 channels for colour images without alpha transparency, with bytes ordered \[red, green, blue, red, green, blue, etc.\]).
* 4 channels for colour images with alpha transparency, with bytes ordered \[red, green, blue, alpha, red, green, blue, alpha, etc.\].

#### toFormat(format)

Convenience method for the above output format methods, where `format` is either:

* an attribute of the `sharp.format` Object e.g. `sharp.format.jpeg`, or
* a String containing `jpeg`, `png`, `webp` or `raw`.

#### quality(quality)

The output quality to use for lossy JPEG, WebP and TIFF output formats. The default quality is `80`.

`quality` is a Number between 1 and 100.

#### progressive()

Use progressive (interlace) scan for JPEG and PNG output. This typically reduces compression performance by 30% but results in an image that can be rendered sooner when decompressed.

#### withMetadata([metadata])

Include all metadata (EXIF, XMP, IPTC) from the input image in the output image.
This will also convert to and add the latest web-friendly v2 sRGB ICC profile.

The optional `metadata` parameter, if present, is an Object with the attributes to update.
New attributes cannot be inserted, only existing attributes updated.

* `orientation` is an integral Number between 0 and 7, used to update the value of the EXIF `Orientation` tag.
This has no effect if the input image does not have an EXIF `Orientation` tag.

The default behaviour, when `withMetadata` is not used, is to strip all metadata and convert to the device-independent sRGB colour space.

#### tile([size], [overlap])

The size and overlap, in pixels, of square Deep Zoom image pyramid tiles.

* `size` is an integral Number between 1 and 8192. The default value is 256 pixels.
* `overlap` is an integral Number between 0 and 8192. The default value is 0 pixels.

```javascript
sharp('input.tiff').tile(256).toFile('output.dzi', function(err, info) {
  // The output.dzi file is the XML format Deep Zoom definition
  // The output_files directory contains 256x256 pixel tiles grouped by zoom level
});
```

#### withoutChromaSubsampling()

Disable the use of [chroma subsampling](http://en.wikipedia.org/wiki/Chroma_subsampling) with JPEG output (4:4:4).

This can improve colour representation at higher quality settings (90+),
but usually increases output file size and typically reduces performance by 25%.

The default behaviour is to use chroma subsampling (4:2:0).

#### compressionLevel(compressionLevel)

An advanced setting for the _zlib_ compression level of the lossless PNG output format. The default level is `6`.

`compressionLevel` is a Number between 0 and 9.

#### withoutAdaptiveFiltering()

An advanced setting to disable adaptive row filtering for the lossless PNG output format.

#### trellisQuantisation() / trellisQuantization()

_Requires libvips to have been compiled with mozjpeg support_

An advanced setting to apply the use of
[trellis quantisation](http://en.wikipedia.org/wiki/Trellis_quantization) with JPEG output.
Reduces file size and slightly increases relative quality at the cost of increased compression time.

#### overshootDeringing()

_Requires libvips to have been compiled with mozjpeg support_

An advanced setting to reduce the effects of
[ringing](http://en.wikipedia.org/wiki/Ringing_%28signal%29) in JPEG output,
in particular where black text appears on a white background (or vice versa).

#### optimiseScans() / optimizeScans()

_Requires libvips to have been compiled with mozjpeg support_

An advanced setting for progressive (interlace) JPEG output.
Calculates which spectrum of DCT coefficients uses the fewest bits.
Usually reduces file size at the cost of increased compression time.

### Attributes

#### format

An Object containing nested boolean values
representing the available input and output formats/methods,
for example:

```javascript
> console.dir(sharp.format);

{ jpeg: { id: 'jpeg',
    input: { file: true, buffer: true, stream: true },
    output: { file: true, buffer: true, stream: true } },
  png: { id: 'png',
    input: { file: true, buffer: true, stream: true },
    output: { file: true, buffer: true, stream: true } },
  webp: { id: 'webp',
    input: { file: true, buffer: true, stream: true },
    output: { file: true, buffer: true, stream: true } },
  tiff: { id: 'tiff',
    input: { file: true, buffer: true, stream: true },
    output: { file: true, buffer: false, stream: false } },
  magick: { id: 'magick',
    input: { file: true, buffer: true, stream: true },
    output: { file: false, buffer: false, stream: false } },
  raw: { id: 'raw',
    input: { file: false, buffer: false, stream: false },
    output: { file: false, buffer: true, stream: true } } }
```

#### queue

An EventEmitter that emits a `change` event when a task is either:

* queued, waiting for _libuv_ to provide a worker thread
* complete

```javascript
sharp.queue.on('change', function(queueLength) {
  console.log('Queue contains ' + queueLength + ' task(s)');
});
```

#### versions

An Object containing the version numbers of libvips and, on Linux, its dependencies.

```javascript
> console.log(sharp.versions);

{ zlib: '1.2.8',
  ffi: '3.2.1',
  glib: '2.46.2',
  xml: '2.9.2',
  gsf: '1.14.34',
  exif: '0.6.21',
  jpeg: '1.4.2',
  png: '1.6.19',
  lcms: '2.7',
  webp: '0.4.4',
  tiff: '4.0.6',
  magick: '6.9.2-6',
  orc: '0.4.24',
  vips: '8.1.1' }
```

### Utilities

#### sharp.cache([options])

If `options` is provided, sets the limits of _libvips'_ operation cache.

* `options.memory` is the maximum memory in MB to use for this cache, with a default value of 50
* `options.files` is the maximum number of files to hold open, with a default value of 20
* `options.items` is the maximum number of operations to cache, with a default value of 100

`options` can also be a boolean, where `true` enables the default cache settings and `false` disables all caching.

This method always returns cache statistics, useful for determining how much working memory is required for a particular task.

```javascript
var stats = sharp.cache();
```

```javascript
sharp.cache( { items: 200 } );
sharp.cache( { files: 0 } );
sharp.cache(false);
```

#### sharp.concurrency([threads])

`threads`, if provided, is the Number of threads _libvips'_ should create for processing each image. The default value is the number of CPU cores. A value of `0` will reset to this default.

This method always returns the current concurrency.

```javascript
var threads = sharp.concurrency(); // 4
sharp.concurrency(2); // 2
sharp.concurrency(0); // 4
```

The maximum number of images that can be processed in parallel is limited by libuv's `UV_THREADPOOL_SIZE` environment variable.

#### sharp.counters()

Provides access to internal task counters.

* `queue` is the number of tasks this module has queued waiting for _libuv_ to provide a worker thread from its pool.
* `process` is the number of resize tasks currently being processed.

```javascript
var counters = sharp.counters(); // { queue: 2, process: 4 }
```

#### sharp.simd([enable])

_Requires libvips to have been compiled with liborc support_

Improves the performance of `resize`, `blur` and `sharpen` operations
by taking advantage of the SIMD vector unit of the CPU, e.g. Intel SSE and ARM NEON.

* `enable`, if present, is a boolean where `true` enables and `false` disables the use of SIMD.

This method always returns the current state.

This feature is currently disabled by default
but future versions may enable it by default.

When enabled, versions of liborc prior to 0.4.24
and versions of libvips prior to 8.2.0
have been known to crash under heavy load.

```javascript
var simd = sharp.simd();
// simd is `true` if SIMD is currently enabled
```

```javascript
var simd = sharp.simd(true);
// attempts to enable the use of SIMD, returning true if available
```
