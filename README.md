# sharp

* [Installation](https://github.com/lovell/sharp#installation)
* [Usage examples](https://github.com/lovell/sharp#usage-examples)
* [API](https://github.com/lovell/sharp#api)
* [Testing](https://github.com/lovell/sharp#testing)
* [Performance](https://github.com/lovell/sharp#performance)
* [Licence](https://github.com/lovell/sharp#licence)

The typical use case for this high speed Node.js module is to convert large images of many formats to smaller, web-friendly JPEG, PNG and WebP images of varying dimensions.

The performance of JPEG resizing is typically 8x faster than ImageMagick and GraphicsMagick, based mainly on the number of CPU cores available.

Memory usage is kept to a minimum, no child processes are spawned, everything remains non-blocking thanks to _libuv_ and Promises/A+ are supported.

This module supports reading and writing JPEG, PNG and WebP images to and from Streams, Buffer objects and the filesystem. It also supports reading images of many other types from the filesystem via libmagick++ or libgraphicsmagick++ if present.

When generating JPEG output all metadata is removed and Huffman tables optimised without having to use separate command line tools like [jpegoptim](https://github.com/tjko/jpegoptim) and [jpegtran](http://jpegclub.org/jpegtran/).

Anyone who has used the Node.js bindings for [GraphicsMagick](https://github.com/aheckmann/gm) will find the API similarly fluent.

This module is powered by the blazingly fast [libvips](https://github.com/jcupitt/libvips) image processing library, originally created in 1989 at Birkbeck College and currently maintained by [John Cupitt](https://github.com/jcupitt).

## Installation

	npm install sharp

### Prerequisites

* Node.js v0.10+
* [libvips](https://github.com/jcupitt/libvips) v7.38.5+

_libvips_ can take advantage of [liborc](http://code.entropywave.com/orc/) if present. Warning: versions of _liborc_ prior to 0.4.19 suffer [memory leaks](https://github.com/lovell/sharp/issues/21#issuecomment-42367306) and version 0.4.19 suffers [buffer overflows](https://github.com/lovell/sharp/issues/21#issuecomment-44813498).

### Install libvips on Mac OS

	brew install homebrew/science/vips --with-webp --with-graphicsmagick

A missing or incorrectly configured _Xcode Command Line Tools_ installation [can lead](https://github.com/lovell/sharp/issues/80) to a `library not found for -ljpeg` error. If so, please try:

	xcode-select --install

The _gettext_ dependency of _libvips_ [can lead](https://github.com/lovell/sharp/issues/9) to a `library not found for -lintl` error. If so, please try:

	brew link gettext --force

### Install libvips on Ubuntu Linux

#### Ubuntu 14.x

	sudo apt-get install libvips-dev

#### Ubuntu 13.x

Compiling from source is recommended:

	sudo apt-get install automake build-essential git gobject-introspection gtk-doc-tools libglib2.0-dev libjpeg-turbo8-dev libpng12-dev libwebp-dev libtiff5-dev libexif-dev libxml2-dev swig
	git clone https://github.com/jcupitt/libvips.git
	cd libvips
	git checkout 7.38
	./bootstrap.sh
	./configure --enable-debug=no --enable-cxx=yes --without-python --without-orc --without-fftw
	make
	sudo make install
	sudo ldconfig

#### Ubuntu 12.x

Requires `libtiff4-dev` instead of `libtiff5-dev` and has [a bug](https://bugs.launchpad.net/ubuntu/+source/libwebp/+bug/1108731) in the libwebp package. Work around these problems by running these commands first:

	sudo add-apt-repository ppa:lyrasis/precise-backports
	sudo apt-get update
	sudo apt-get install libtiff4-dev

Then follow Ubuntu 13.x instructions.

### Install libvips on Heroku

[Alessandro Tagliapietra](https://github.com/alex88) maintains an [Heroku buildpack for libvips](https://github.com/alex88/heroku-buildpack-vips) and its dependencies.

## Usage examples

```javascript
var sharp = require('sharp');
```

```javascript
sharp('input.jpg').resize(300, 200).toFile('output.jpg', function(err) {
  if (err) {
    throw err;
  }
  // output.jpg is a 300 pixels wide and 200 pixels high image
  // containing a scaled and cropped version of input.jpg
});
```

```javascript
var transformer = sharp().resize(300, 200);
readableStream.pipe(transformer).pipe(writableStream);
// Read image data from readableStream, resize and write image data to writableStream
```

```javascript
var pipeline = sharp().rotate().resize(null, 200).progressive().toBuffer(function(err, outputBuffer, info) {
  if (err) {
    throw err;
  }
  // outputBuffer contains 200px high progressive JPEG image data, auto-rotated using EXIF Orientation tag
  // info.width and info.height contain the final pixel dimensions of the resized image
});
readableStream.pipe(pipeline);
```

```javascript
sharp('input.png').rotate(180).resize(300).sharpen().quality(90).webp().toBuffer().then(function(outputBuffer, info) {
  // outputBuffer contains 300px wide, upside down, sharpened, 90% quality WebP image data
  // info.width and info.height contain the final pixel dimensions of the resized image
});
```

```javascript
http.createServer(function(request, response) {
  response.writeHead(200, {'Content-Type': 'image/webp'});
  sharp('input.jpg').rotate().resize(200).webp().pipe(response);
}).listen(8000);
// Create HTTP server that always returns auto-rotated 'input.jpg',
// resized to 200 pixels wide, in WebP format
```

```javascript
sharp(inputBuffer).resize(200, 300).bicubicInterpolation().embedWhite().toFile('output.tiff').then(function() {
  // output.tiff is a 200 pixels wide and 300 pixels high image containing a bicubic scaled
  // version, embedded on a white canvas, of the image data in buffer
});
```

```javascript
sharp('input.gif').resize(200, 300).embedBlack().webp().toBuffer(function(err, outputBuffer) {
  if (err) {
    throw err;
  }
  // outputBuffer contains WebP image data of a 200 pixels wide and 300 pixels high
  // containing a scaled version, embedded on a black canvas, of input.gif
});
```

```javascript
sharp(inputBuffer).resize(200, 200).max().jpeg().toBuffer().then(function(outputBuffer, info) {
  // outputBuffer contains JPEG image data no wider than 200 pixels and no higher
  // than 200 pixels regardless of the inputBuffer image dimensions
  // info.width and info.height contain the final pixel dimensions of the resized image
});
```

## API

### Input methods

#### sharp([input])

Constructor to which further methods are chained. `input`, if present, can be one of:

* Buffer containing JPEG, PNG or WebP image data, or
* String containing the filename of an image, with most major formats supported.

The object returned implements the [stream.Duplex](http://nodejs.org/api/stream.html#stream_class_stream_duplex) class.

JPEG, PNG or WebP format image data can be streamed into the object when `input` is not provided.

JPEG, PNG or WebP format image data can be streamed out from this object.

#### sequentialRead()

An advanced setting that switches the libvips access method to `VIPS_ACCESS_SEQUENTIAL`. This will reduce memory usage and can improve performance on some systems.

### Image transformation options

#### resize(width, [height])

Scale output to `width` x `height`. By default, the resized image is cropped to the exact size specified.

`width` is the Number of pixels wide the resultant image should be. Use `null` or `undefined` to auto-scale the width to match the height.

`height` is the Number of pixels high the resultant image should be. Use `null` or `undefined` to auto-scale the height to match the width.

#### crop()

Crop the resized image to the exact size specified, the default behaviour.

#### max()

Preserving aspect ratio, resize the image to the maximum width or height specified.

Both `width` and `height` must be provided via `resize` otherwise the behaviour will default to `crop`.

#### embedWhite()

Embed the resized image on a white background of the exact size specified.

#### embedBlack()

Embed the resized image on a black background of the exact size specified.

#### rotate([angle])

Rotate the output image by either an explicit angle or auto-orient based on the EXIF `Orientation` tag.

`angle`, if present, is a Number with a value of `0`, `90`, `180` or `270`.

Use this method without `angle` to determine the angle from EXIF data. Mirroring is currently unsupported.

#### withoutEnlargement()

Do not enlarge the output image if the input image width *or* height are already less than the required dimensions.

This is equivalent to GraphicsMagick's `>` geometry option: "change the dimensions of the image only if its width or height exceeds the geometry specification".

#### sharpen()

Perform a mild sharpen of the resultant image. This typically reduces performance by 30%.

#### bilinearInterpolation()

Use [bilinear interpolation](http://en.wikipedia.org/wiki/Bilinear_interpolation) for image resizing, the default (and fastest) interpolation if none is specified.

#### bicubicInterpolation()

Use [bicubic interpolation](http://en.wikipedia.org/wiki/Bicubic_interpolation) for image resizing. This typically reduces performance by 5%.

#### nohaloInterpolation()

Use [Nohalo interpolation](http://eprints.soton.ac.uk/268086/) for image resizing. This typically reduces performance by a factor of 2.

### Output options

#### progressive()

Use progressive (interlace) scan for JPEG and PNG output. This typically reduces compression performance by 30% but results in an image that can be rendered sooner when decompressed.

#### quality(quality)

The output quality to use for lossy JPEG, WebP and TIFF output formats. The default quality is `80`.

`quality` is a Number between 1 and 100.

#### compressionLevel(compressionLevel)

An advanced setting for the _zlib_ compression level of the lossless PNG output format. The default level is `6`.

`compressionLevel` is a Number between -1 and 9.

#### jpeg()

Use JPEG format for the output image.

#### png()

Use PNG format for the output image.

#### webp()

Use WebP format for the output image.

### Output methods

#### toFile(filename, [callback])

`filename` is a String containing the filename to write the image data to. The format is inferred from the extension, with JPEG, PNG, WebP and TIFF supported.

`callback`, if present, is called with two arguments `(err, info)` where:

* `err` contains an error message, if any
* `info` contains the final resized image dimensions in its `width` and `height` properties

A Promises/A+ promise is returned when `callback` is not provided.

#### toBuffer([callback])

Write image data to a Buffer, the format of which will match the input image by default. JPEG, PNG and WebP are supported.

`callback`, if present, gets three arguments `(err, buffer, info)` where:

* `err` is an error message, if any
* `buffer` is the resultant image data
* `info` contains the final resized image dimensions in its `width` and `height` properties

A Promises/A+ promise is returned when `callback` is not provided.

### Utility methods

#### sharp.cache([memory], [items])

If `memory` or `items` are provided, set the limits of _libvips'_ operation cache.

* `memory` is the maximum memory in MB to use for this cache, with a default value of 100
* `items` is the maximum number of operations to cache, with a default value of 500

This method always returns cache statistics, useful for determining how much working memory is required for a particular task.

```javascript
var stats = sharp.cache(); // { current: 75, high: 99, memory: 100, items: 500 }
sharp.cache(200); // { current: 75, high: 99, memory: 200, items: 500 }
sharp.cache(50, 200); // { current: 49, high: 99, memory: 50, items: 200}
```

#### sharp.counters()

Provides access to internal task counters.

* `queue` is the number of tasks queuing for _libuv_ to provide a thread from its pool
* `process` is the number of tasks being processed

```javascript
var counters = sharp.counters(); // { queue: 2, process: 4 }
```

## Testing

[![Build Status](https://travis-ci.org/lovell/sharp.png?branch=master)](https://travis-ci.org/lovell/sharp)

	npm test

Running the tests requires both ImageMagick and GraphicsMagick plus one of either libmagick++-dev or libgraphicsmagick++.

	brew install imagemagick
	brew install graphicsmagick

	sudo apt-get install imagemagick graphicsmagick libmagick++-dev

## Performance

### Test environment

* Intel Xeon [L5520](http://ark.intel.com/products/40201/Intel-Xeon-Processor-L5520-8M-Cache-2_26-GHz-5_86-GTs-Intel-QPI) 2.27GHz 8MB cache
* Ubuntu 13.10
* libvips 7.38.5

### The contenders

* [imagemagick-native](https://github.com/mash/node-imagemagick-native) - Supports Buffers only and blocks main V8 thread whilst processing.
* [imagemagick](https://github.com/rsms/node-imagemagick) - Supports filesystem only and "has been unmaintained for a long time".
* [gm](https://github.com/aheckmann/gm) - Fully featured wrapper around GraphicsMagick.
* sharp - Caching within libvips disabled to ensure a fair comparison.

### The task

Decompress a 2725x2225 JPEG image, resize and crop to 720x480, then compress to JPEG.

### Results

| Module                | Input  | Output | Ops/sec | Speed-up |
| :-------------------- | :----- | :----- | ------: | -------: |
| imagemagick-native    | buffer | buffer |    0.97 |        1 |
| imagemagick           | file   | file   |    2.49 |      2.6 |
| gm                    | buffer | file   |    3.72 |      3.8 |
| gm                    | buffer | buffer |    3.80 |      3.9 |
| gm                    | file   | file   |    3.67 |      3.8 |
| gm                    | file   | buffer |    3.67 |      3.8 |
| sharp                 | buffer | file   |   13.62 |     14.0 |
| sharp                 | buffer | buffer |   12.43 |     12.8 |
| sharp                 | file   | file   |   13.02 |     13.4 |
| sharp                 | file   | buffer |   11.15 |     11.5 |
| sharp +sharpen        | file   | buffer |   10.26 |     10.6 |
| sharp +progressive    | file   | buffer |    9.44 |      9.7 |
| sharp +sequentialRead | file   | buffer |   11.94 |     12.3 |

You can expect much greater performance with caching enabled (default) and using 16+ core machines.

## Licence

Copyright 2013, 2014 Lovell Fuller, Pierre Inglebert, Jonathan Ong and Chanon Sajjamanochai

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at [http://www.apache.org/licenses/LICENSE-2.0](http://www.apache.org/licenses/LICENSE-2.0.html)

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
