# sharp

* [Installation](https://github.com/lovell/sharp#installation)
* [Usage examples](https://github.com/lovell/sharp#usage-examples)
* [API](https://github.com/lovell/sharp#api)
* [Testing](https://github.com/lovell/sharp#testing)
* [Performance](https://github.com/lovell/sharp#performance)
* [Licence](https://github.com/lovell/sharp#licence)

The typical use case for this high speed Node.js module is to convert large images of many formats to smaller, web-friendly JPEG, PNG and WebP images of varying dimensions.

The performance of JPEG resizing is typically 8x faster than ImageMagick and GraphicsMagick, based mainly on the number of CPU cores available. Everything remains non-blocking thanks to _libuv_.

This module supports reading and writing images of JPEG, PNG and WebP to and from both Buffer objects and the filesystem. It also supports reading images of many other types from the filesystem via libmagick++ or libgraphicsmagick++ if present.

When generating JPEG output all metadata is removed and Huffman tables optimised without having to use separate command line tools like [jpegoptim](https://github.com/tjko/jpegoptim) and [jpegtran](http://jpegclub.org/jpegtran/).

Anyone who has used the Node.js bindings for [GraphicsMagick](https://github.com/aheckmann/gm) will find the API similarly fluent.

This module is powered by the blazingly fast [libvips](https://github.com/jcupitt/libvips) image processing library, originally created in 1989 at Birkbeck College and currently maintained by John Cupitt.

## Installation

	npm install sharp

### Prerequisites

* Node.js v0.10+
* [libvips](https://github.com/jcupitt/libvips) v7.38.5+

### Install libvips on Mac OS

	brew install homebrew/science/vips --with-webp --with-graphicsmagick

The _gettext_ dependency of _libvips_ [can lead](https://github.com/lovell/sharp/issues/9) to a `library not found for -lintl` error. If so, please try:

	brew link gettext --force

### Install libvips on Ubuntu/Debian Linux

	sudo apt-get install automake build-essential git gobject-introspection gtk-doc-tools libfftw3-dev libglib2.0-dev libjpeg-turbo8-dev libpng12-dev libwebp-dev libtiff5-dev liborc-0.4-dev libxml2-dev swig
	git clone https://github.com/jcupitt/libvips.git
	cd libvips
	git checkout 7.38
	./bootstrap.sh
	./configure --enable-debug=no --enable-cxx=no --without-python
	make
	sudo make install
	sudo ldconfig

Ubuntu 12.04 requires `libtiff4-dev` instead of `libtiff5-dev` and has [a bug](https://bugs.launchpad.net/ubuntu/+source/libwebp/+bug/1108731) in the libwebp package. Work around these problems by running these command first:

	sudo add-apt-repository ppa:lyrasis/precise-backports
	sudo apt-get update
	sudo apt-get install libtiff4-dev

## Usage examples

```javascript
var sharp = require('sharp');
```

```javascript
sharp('input.jpg').resize(300, 200).write('output.jpg', function(err) {
  if (err) {
    throw err;
  }
  // output.jpg is a 300 pixels wide and 200 pixels high image
  // containing a scaled and cropped version of input.jpg
});
```

```javascript
sharp('input.jpg').resize(null, 200).progressive().toBuffer(function(err, buffer) {
  if (err) {
    throw err;
  }
  // buffer contains progressive JPEG image data, 200 pixels high
});
```

```javascript
sharp('input.png').resize(300).sharpen().webp(function(err, buffer) {
  if (err) {
    throw err;
  }
  // buffer contains sharpened WebP image data (converted from PNG), 300 pixels wide
});
```

```javascript
sharp(buffer).resize(200, 300).embedWhite().write('output.tiff', function(err) {
  if (err) {
    throw err;
  }
  // output.tiff is a 200 pixels wide and 300 pixels high image containing a scaled
  // version, embedded on a white canvas, of the image data in buffer
});
```

```javascript
sharp('input.gif').resize(200, 300).embedBlack().webp(function(err, buffer) {
  if (err) {
    throw err;
  }
  // buffer contains WebP image data of a 200 pixels wide and 300 pixels high image
  // containing a scaled version, embedded on a black canvas, of input.gif
});
```

## API

### sharp(input)

Constructor to which further methods are chained. `input` can be one of:

* Buffer containing JPEG, PNG or WebP image data, or
* String containing the filename of an image, with most major formats supported.

### resize(width, [height])

Scale to `width` x `height`. By default, the resized image is cropped to the exact size specified.

`width` is the Number of pixels wide the resultant image should be. Use `null` or `undefined` to auto-scale the width to match the height.

`height` is the Number of pixels high the resultant image should be. Use `null` or `undefined` to auto-scale the height to match the width.

### crop()

Crop the resized image to the exact size specified, the default behaviour.

### embedWhite()

Embed the resized image on a white background of the exact size specified.

### embedBlack()

Embed the resized image on a black background of the exact size specified.

### sharpen()

Perform a mild sharpen of the resultant image. This typically reduces performance by 30%.

### progressive()

Use progressive (interlace) scan for JPEG and PNG output. This typically reduces compression performance by 30% but results in an image that can be rendered sooner when decompressed.

### sequentialRead()

An advanced setting that switches the libvips access method to `VIPS_ACCESS_SEQUENTIAL`. This will reduce memory usage and can improve performance on some systems.

### write(filename, callback)

`filename` is a String containing the filename to write the image data to. The format is inferred from the extension, with JPEG, PNG, WebP and TIFF supported.

`callback` is called with a single argument `(err)` containing an error message, if any.

### jpeg(callback)

Write JPEG image data to a Buffer.

`callback` gets two arguments `(err, buffer)` where `err` is an error message, if any, and `buffer` is the resultant JPEG image data.

### png(callback)

Write PNG image data to a Buffer.

`callback` gets two arguments `(err, buffer)` where `err` is an error message, if any, and `buffer` is the resultant PNG image data.

### webp(callback)

Write WebP image data to a Buffer.

`callback` gets two arguments `(err, buffer)` where `err` is an error message, if any, and `buffer` is the resultant WebP image data.

### toBuffer(callback)

Write image data to a Buffer, the format of which will match the input image. JPEG, PNG and WebP are supported.

`callback` gets two arguments `(err, buffer)` where `err` is an error message, if any, and `buffer` is the resultant image data.

### sharp.cache([limit])

If `limit` is provided, set the (soft) limit of _libvips_ working/cache memory to this value in MB. The default value is 100.

This method always returns cache statistics, useful for determining how much working memory is required for a particular task.

Warnings such as _Application transferred too many scanlines_ are a good indicator you've set this value too low.

```javascript
var stats = sharp.cache(); // { current: 98, high: 115, limit: 100 }
sharp.cache(200); // { current: 98, high: 115, limit: 200 }
sharp.cache(50); // { current: 49, high: 115, limit: 50 }
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

Copyright 2013, 2014 Lovell Fuller and Pierre Inglebert

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at [http://www.apache.org/licenses/LICENSE-2.0](http://www.apache.org/licenses/LICENSE-2.0.html)

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
