# sharp

* [Installation](https://github.com/lovell/sharp#installation)
* [Usage examples](https://github.com/lovell/sharp#usage-examples)
* [API](https://github.com/lovell/sharp#api)
* [Testing](https://github.com/lovell/sharp#testing)
* [Performance](https://github.com/lovell/sharp#performance)
* [Licence](https://github.com/lovell/sharp#licence)

The typical use case for this high speed Node.js module is to convert large images of many formats to smaller, web-friendly JPEG, PNG and WebP images of varying dimensions.

The performance of JPEG resizing is typically 8x faster than ImageMagick and GraphicsMagick, based mainly on the number of CPU cores available. Everything remains non-blocking thanks to _libuv_ and Promises/A+ are supported.

This module supports reading and writing images of JPEG, PNG and WebP to and from both Buffer objects and the filesystem. It also supports reading images of many other types from the filesystem via libmagick++ or libgraphicsmagick++ if present.

When generating JPEG output all metadata is removed and Huffman tables optimised without having to use separate command line tools like [jpegoptim](https://github.com/tjko/jpegoptim) and [jpegtran](http://jpegclub.org/jpegtran/).

Anyone who has used the Node.js bindings for [GraphicsMagick](https://github.com/aheckmann/gm) will find the API similarly fluent.

This module is powered by the blazingly fast [libvips](https://github.com/jcupitt/libvips) image processing library, originally created in 1989 at Birkbeck College and currently maintained by John Cupitt.

## Installation

	npm install sharp

### Prerequisites

* Node.js v0.10+
* [libvips](https://github.com/jcupitt/libvips) v7.38.5+

_libvips_ can take advantage of [liborc](http://code.entropywave.com/orc/) if present. Warning: versions of _liborc_ prior to 0.4.19 suffer [memory leaks](https://github.com/lovell/sharp/issues/21#issuecomment-42367306) and version 0.4.19 suffers [buffer overflows](https://github.com/lovell/sharp/issues/21#issuecomment-44813498).

### Install libvips on Mac OS

	brew install homebrew/science/vips --with-webp --with-graphicsmagick

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
sharp('input.jpg').rotate().resize(null, 200).progressive().toBuffer(function(err, outputBuffer) {
  if (err) {
    throw err;
  }
  // outputBuffer contains 200px high progressive JPEG image data, auto-rotated using EXIF Orientation tag
});
```

```javascript
sharp('input.png').rotate(180).resize(300).sharpen().quality(90).webp().then(function(outputBuffer) {
  // outputBuffer contains 300px wide, upside down, sharpened, 90% quality WebP image data
});
```

```javascript
sharp(inputBuffer).resize(200, 300).bicubicInterpolation().embedWhite().toFile('output.tiff').then(function() {
  // output.tiff is a 200 pixels wide and 300 pixels high image containing a bicubic scaled
  // version, embedded on a white canvas, of the image data in buffer
});
```

```javascript
sharp('input.gif').resize(200, 300).embedBlack().webp(function(err, outputBuffer) {
  if (err) {
    throw err;
  }
  // outputBuffer contains WebP image data of a 200 pixels wide and 300 pixels high
  // containing a scaled version, embedded on a black canvas, of input.gif
});
```

```javascript
sharp(inputBuffer).resize(200, 200).max().jpeg().then(function(outputBuffer) {
  // outputBuffer contains JPEG image data no wider than 200 pixels and no higher
  // than 200 pixels regardless of the inputBuffer image dimensions
});
```

## API

### sharp(input)

Constructor to which further methods are chained. `input` can be one of:

* Buffer containing JPEG, PNG or WebP image data, or
* String containing the filename of an image, with most major formats supported.

### resize(width, [height])

Scale output to `width` x `height`. By default, the resized image is cropped to the exact size specified.

`width` is the Number of pixels wide the resultant image should be. Use `null` or `undefined` to auto-scale the width to match the height.

`height` is the Number of pixels high the resultant image should be. Use `null` or `undefined` to auto-scale the height to match the width.

### crop()

Crop the resized image to the exact size specified, the default behaviour.

### max()

Preserving aspect ratio, resize the image to the maximum width or height specified.

Both `width` and `height` must be provided via `resize` otherwise the behaviour will default to `crop`.

### embedWhite()

Embed the resized image on a white background of the exact size specified.

### embedBlack()

Embed the resized image on a black background of the exact size specified.

### rotate([angle])

Rotate the output image by either an explicit angle or auto-orient based on the EXIF `Orientation` tag.

`angle`, if present, is a Number with a value of `0`, `90`, `180` or `270`.

Use this method without `angle` to determine the angle from EXIF data. Mirroring is currently unsupported.

### withoutEnlargement()

Do not enlarge the output image if the input image width *or* height are already less than the required dimensions.

This is equivalent to GraphicsMagick's `>` geometry option: "change the dimensions of the image only if its width or height exceeds the geometry specification".

### sharpen()

Perform a mild sharpen of the resultant image. This typically reduces performance by 30%.

### bilinearInterpolation()

Use [bilinear interpolation](http://en.wikipedia.org/wiki/Bilinear_interpolation) for image resizing, the default (and fastest) interpolation if none is specified.

### bicubicInterpolation()

Use [bicubic interpolation](http://en.wikipedia.org/wiki/Bicubic_interpolation) for image resizing. This typically reduces performance by 5%.

### nohaloInterpolation()

Use [Nohalo interpolation](http://eprints.soton.ac.uk/268086/) for image resizing. This typically reduces performance by a factor of 2.

### progressive()

Use progressive (interlace) scan for JPEG and PNG output. This typically reduces compression performance by 30% but results in an image that can be rendered sooner when decompressed.

### quality(quality)

The output quality to use for lossy JPEG, WebP and TIFF output formats. The default quality is `80`.

`quality` is a Number between 1 and 100.

### compressionLevel(compressionLevel)

An advanced setting for the _zlib_ compression level of the lossless PNG output format. The default level is `6`.

`compressionLevel` is a Number between -1 and 9.

### sequentialRead()

An advanced setting that switches the libvips access method to `VIPS_ACCESS_SEQUENTIAL`. This will reduce memory usage and can improve performance on some systems.

### toFile(filename, [callback])

`filename` is a String containing the filename to write the image data to. The format is inferred from the extension, with JPEG, PNG, WebP and TIFF supported.

`callback`, if present, is called with a single argument `(err)` containing an error message, if any.

A Promises/A+ promise is returned when `callback` is not provided.

### toBuffer([callback])

Write image data to a Buffer, the format of which will match the input image. JPEG, PNG and WebP are supported.

`callback`, if present, gets two arguments `(err, buffer)` where `err` is an error message, if any, and `buffer` is the resultant image data.

A Promises/A+ promise is returned when `callback` is not provided.

### jpeg([callback])

Write JPEG image data to a Buffer.

`callback`, if present, gets two arguments `(err, buffer)` where `err` is an error message, if any, and `buffer` is the resultant JPEG image data.

A Promises/A+ promise is returned when `callback` is not provided.

### png([callback])

Write PNG image data to a Buffer.

`callback`, if present, gets two arguments `(err, buffer)` where `err` is an error message, if any, and `buffer` is the resultant PNG image data.

A Promises/A+ promise is returned when `callback` is not provided.

### webp([callback])

Write WebP image data to a Buffer.

`callback`, if present, gets two arguments `(err, buffer)` where `err` is an error message, if any, and `buffer` is the resultant WebP image data.

A Promises/A+ promise is returned when `callback` is not provided.

### sharp.cache([limit])

If `limit` is provided, set the (soft) limit of _libvips_ working/cache memory to this value in MB. The default value is 100.

This method always returns cache statistics, useful for determining how much working memory is required for a particular task.

Warnings such as _Application transferred too many scanlines_ are a good indicator you've set this value too low.

```javascript
var stats = sharp.cache(); // { current: 98, high: 115, limit: 100, queue: 0 }
sharp.cache(200); // { current: 98, high: 115, limit: 200, queue: 0 }
sharp.cache(50); // { current: 49, high: 115, limit: 50, queue: 0 }
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

Copyright 2013, 2014 Lovell Fuller and Pierre Inglebert

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at [http://www.apache.org/licenses/LICENSE-2.0](http://www.apache.org/licenses/LICENSE-2.0.html)

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
