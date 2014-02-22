# sharp

_adj_

1. clearly defined; distinct: a sharp photographic image. 
2. quick, brisk, or spirited. 
3. shrewd or astute: a sharp bargainer. 
4. (Informal.) very stylish: a sharp dresser; a sharp jacket. 

The typical use case for this high speed Node.js module is to convert large JPEG, PNG, WebP and TIFF images to smaller images of varying dimensions.

The performance of JPEG resizing is typically 15x-25x faster than ImageMagick and GraphicsMagick, based mainly on the number of CPU cores available.

This module supports reading and writing images to and from both the filesystem and Buffer objects (TIFF is limited to filesystem only). Everything remains non-blocking thanks to _libuv_.

Under the hood you'll find the blazingly fast [libvips](https://github.com/jcupitt/libvips) image processing library, originally created in 1989 at Birkbeck College and currently maintained by John Cupitt.

## Prerequisites

* Node.js v0.8+
* [libvips](https://github.com/jcupitt/libvips) v7.38+

For the sharpest results, please compile libvips from source.

## Install

	npm install sharp

## Usage

	var sharp = require("sharp");

### resize(input, output, width, height, [options], callback)

Scale and crop to `width` x `height` calling `callback` when complete.

`input` can either be a filename String or a Buffer.

`output` can either be a filename String or one of `sharp.buffer.jpeg`, `sharp.buffer.png` or `sharp.buffer.webp` to pass a Buffer containing JPEG, PNG or WebP image data to `callback`.

`width` is the Number of pixels wide the resultant image should be.

`height` is the Number of pixels high the resultant image should be.

`options` is optional, and can contain one or more of:

* `canvas` can be one of `sharp.canvas.crop`, `sharp.canvas.embedWhite` or `sharp.canvas.embedBlack`. Defaults to `sharp.canvas.crop`.
* `sharpen` when set to true will perform a mild sharpen of the resultant image. This typically reduces performance by 30%.
* `progressive` when set will use progressive (interlace) scan for the output. This typically reduces performance by 30%.
* `sequentialRead` is an advanced setting that, when set, switches the libvips access method to `VIPS_ACCESS_SEQUENTIAL`. This will reduce memory usage and can improve performance on some systems.

`callback` gets two arguments `(err, buffer)` where `err` is an error message, if any, and `buffer` is the resultant image data when a Buffer is requested.

### Examples

```javascript
sharp.resize("input.jpg", "output.jpg", 300, 200, function(err) {
  if (err) {
    throw err;
  }
  // output.jpg is a 300 pixels wide and 200 pixels high image
  // containing a scaled and cropped version of input.jpg
});
```

```javascript
sharp.resize("input.jpg", sharp.buffer.jpeg, 300, 200, {progressive: true}, function(err, buffer) {
  if (err) {
    throw err;
  }
  // buffer contains progressive JPEG image data
});
```

```javascript
sharp.resize("input.webp", sharp.buffer.png, 300, 200, {sharpen: true}, function(err, buffer) {
  if (err) {
    throw err;
  }
  // buffer contains sharpened PNG image data (converted from JPEG)
});
```

```javascript
sharp.resize(buffer, "output.tiff", 200, 300, {canvas: sharp.canvas.embedWhite}, function(err) {
  if (err) {
    throw err;
  }
  // output.tiff is a 200 pixels wide and 300 pixels high image containing a scaled version
  // of the image data contained in buffer embedded on a white canvas
});
```

```javascript
sharp.resize("input.jpg", sharp.buffer.webp, 200, 300, {canvas: sharp.canvas.embedBlack}, function(err, buffer) {
  if (err) {
    throw err;
  }
  // buffer contains WebP image data of a 200 pixels wide and 300 pixels high image
  // containing a scaled version of input.png embedded on a black canvas
});
```

## Testing

	npm test

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
* epeg-file-file x 23.82 ops/sec ±0.18% (60 runs sampled)
* epeg-file-buffer x 23.98 ops/sec ±0.16% (61 runs sampled)

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

Copyright 2013, 2014 Lovell Fuller

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at [http://www.apache.org/licenses/LICENSE-2.0](http://www.apache.org/licenses/LICENSE-2.0.html)

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
