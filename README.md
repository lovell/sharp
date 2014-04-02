# sharp

_adj_

1. clearly defined; distinct: a sharp photographic image.
2. quick, brisk, or spirited.
3. shrewd or astute: a sharp bargainer.
4. (Informal.) very stylish: a sharp dresser; a sharp jacket.

The typical use case for this high speed Node.js module is to convert large JPEG, PNG, WebP and TIFF images to smaller images of varying dimensions.

The performance of JPEG resizing is typically 15x-25x faster than ImageMagick and GraphicsMagick, based mainly on the number of CPU cores available.

When generating JPEG output all metadata is removed and Huffman tables optimised without having to use separate command line tools like [jpegoptim](https://github.com/tjko/jpegoptim) and [jpegtran](http://jpegclub.org/jpegtran/).

This module supports reading and writing images to and from both the filesystem and Buffer objects (TIFF is limited to filesystem only). Everything remains non-blocking thanks to _libuv_.

Anyone who has used the Node.js bindings for [GraphicsMagick](https://github.com/aheckmann/gm) will find the API similarly fluent.

This module is powered by the blazingly fast [libvips](https://github.com/jcupitt/libvips) image processing library, originally created in 1989 at Birkbeck College and currently maintained by John Cupitt.

## Prerequisites

* Node.js v0.10+
* [libvips](https://github.com/jcupitt/libvips) v7.38.5+

### Install libvips on Mac OS

	brew install homebrew/science/vips --with-webp

The _gettext_ dependency of _libvips_ [can lead](https://github.com/lovell/sharp/issues/9) to a `library not found for -lintl` error. If so, please try:

	brew link gettext --force

### Install libvips on Ubuntu/Debian Linux

	sudo apt-get install automake build-essential git gobject-introspection gtk-doc-tools libfftw3-dev libglib2.0-dev libjpeg-turbo8-dev libpng12-dev libwebp-dev libtiff5-dev liborc-0.4-dev libxml2-dev swig
	git clone https://github.com/jcupitt/libvips.git
	cd libvips
	./bootstrap.sh
	./configure --enable-debug=no
	make
	sudo make install
	sudo ldconfig

## Install

	npm install sharp

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
sharp('input.jpg').resize(200, 300).embedBlack().webp(function(err, buffer) {
  if (err) {
    throw err;
  }
  // buffer contains WebP image data of a 200 pixels wide and 300 pixels high image
  // containing a scaled version, embedded on a black canvas, of input.jpg
});
```

## API

### sharp(input)

Constructor to which further methods are chained.

`input` can either be a filename String or a Buffer.

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

Write image data to a Buffer, the format of which will match the input image.

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

	npm test

Running the tests requires both ImageMagick and GraphicsMagick to be installed.

	brew install imagemagick
	brew install graphicsmagick

	sudo apt-get install imagemagick graphicsmagick

## Performance

Test environment:

* AMD Athlon 4 core 3.3GHz 512KB L2 CPU 1333 DDR3
* libvips 7.38
* libjpeg-turbo8 1.3.0
* libpng 1.6.6
* zlib1g 1.2.7
* libwebp 0.3.0
* libtiff 4.0.2

`-file-buffer` indicates read from file and write to buffer, `-buffer-file` indicates read from buffer and write to file etc.

`-sharpen`, `-progressive` etc. demonstrate the negative effect of options on performance.

### JPEG

* imagemagick x 5.53 ops/sec ±0.62% (31 runs sampled)
* gm-file-file x 4.10 ops/sec ±0.41% (25 runs sampled)
* gm-file-buffer x 4.10 ops/sec ±0.36% (25 runs sampled)

* sharp-buffer-file x 20.76 ops/sec ±0.55% (54 runs sampled)
* sharp-buffer-buffer x 20.90 ops/sec ±0.26% (54 runs sampled)
* sharp-file-file x 91.78 ops/sec ±0.38% (88 runs sampled)
* sharp-file-buffer x __93.05 ops/sec__ ±0.61% (76 runs sampled)

* sharp-file-buffer-sharpen x 63.09 ops/sec ±5.58% (63 runs sampled)
* sharp-file-buffer-progressive x 61.68 ops/sec ±0.53% (76 runs sampled)
* sharp-file-buffer-sequentialRead x 60.66 ops/sec ±0.38% (75 runs sampled)

### PNG

* imagemagick x 4.27 ops/sec ±0.21% (25 runs sampled)
* gm-file-file x 8.33 ops/sec ±0.19% (44 runs sampled)
* gm-file-buffer x 7.45 ops/sec ±0.16% (40 runs sampled)
 
* sharp-buffer-file x 4.94 ops/sec ±118.46% (26 runs sampled)
* sharp-buffer-buffer x 12.59 ops/sec ±0.55% (64 runs sampled)
* sharp-file-file x 44.06 ops/sec ±6.86% (75 runs sampled)
* sharp-file-buffer x __46.29 ops/sec__ ±0.38% (76 runs sampled)

* sharp-file-buffer-sharpen x 38.86 ops/sec ±0.22% (65 runs sampled)
* sharp-file-buffer-progressive x 46.35 ops/sec ±0.20% (76 runs sampled)
* sharp-file-buffer-sequentialRead x 29.02 ops/sec ±0.62% (72 runs sampled)

### WebP

* sharp-buffer-file x 3.30 ops/sec ±117.14% (19 runs sampled)
* sharp-buffer-buffer x 7.66 ops/sec ±5.83% (43 runs sampled)
* sharp-file-file x 9.88 ops/sec ±0.98% (52 runs sampled)
* sharp-file-buffer x 9.95 ops/sec ±0.25% (52 runs sampled)
* sharp-file-buffer-sharpen x 9.05 ops/sec ±0.36% (48 runs sampled)
* sharp-file-buffer-sequentialRead x 9.87 ops/sec ±0.98% (52 runs sampled)

### TIFF

* sharp-file-file x 68.24 ops/sec ±5.93% (85 runs sampled)
* sharp-file-file-sharpen x 50.76 ops/sec ±0.52% (82 runs sampled)
* sharp-file-file-sequentialRead x 36.37 ops/sec ±0.90% (87 runs sampled)

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
