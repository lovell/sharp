# sharp

_adj_

1. clearly defined; distinct: a sharp photographic image. 
2. quick, brisk, or spirited. 
3. shrewd or astute: a sharp bargainer. 
4. (Informal.) very stylish: a sharp dresser; a sharp jacket. 

The typical use case for this high speed Node.js module is to convert large JPEG and PNG images to smaller JPEG and PNG images of varying dimensions.

Under the hood you'll find the blazingly fast [libvips](https://github.com/jcupitt/libvips) image processing library, originally created in 1989 at Birkbeck College and currently maintained by John Cupitt.

Performance is up to 18x faster than ImageMagick and up to 8x faster than GraphicsMagick, based mainly on the number of CPU cores available.

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

`input` can either be a filename String or a Buffer. When using a filename libvips will `mmap` the file for improved performance. 

`output` can either be a filename String or one of `sharp.buffer.jpeg` or `sharp.buffer.png` to pass a Buffer containing image data to `callback`.

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
sharp.resize("input.jpg", sharp.buffer.png, 300, 200, {sharpen: true}, function(err, buffer) {
  if (err) {
    throw err;
  }
  // buffer contains sharpened PNG image data (converted from JPEG)
});
```

```javascript
sharp.resize(buffer, "output.jpg", 200, 300, {canvas: sharp.canvas.embedWhite}, function(err) {
  if (err) {
    throw err;
  }
  // output.jpg is a 200 pixels wide and 300 pixels high image containing a scaled version
  // of the image data contained in buffer embedded on a white canvas
});
```

```javascript
sharp.resize("input.jpg", sharp.buffer.jpeg, 200, 300, {canvas: sharp.canvas.embedBlack}, function(err, buffer) {
  if (err) {
    throw err;
  }
  // buffer contains JPEG image data of a 200 pixels wide and 300 pixels high image
  // containing a scaled version of input.png embedded on a black canvas
});
```

## Testing

	npm test

## Performance

Test environment:

* AMD Athlon 4 core 3.3GHz 512KB L2 CPU 1333 DDR3
* libvips 7.37
* libjpeg-turbo8 1.3.0
* libpng 1.6.6
* zlib1g 1.2.7

`-file-buffer` indicates read from file and write to buffer, `-buffer-file` indicates read from buffer and write to file etc.

`-sharpen`, `-progressive` etc. demonstrate the negative effect of options on performance.

### JPEG

* imagemagick x 5.50 ops/sec ±0.48% (31 runs sampled)
* gm-file-file x 11.19 ops/sec ±0.51% (57 runs sampled)
* gm-file-buffer x 11.11 ops/sec ±0.42% (57 runs sampled)
* epeg-file-file x 28.59 ops/sec ±0.09% (71 runs sampled)
* epeg-file-buffer x 28.67 ops/sec ±0.14% (71 runs sampled)

* sharp-buffer-file x 24.72 ops/sec ±0.42% (62 runs sampled)
* sharp-buffer-buffer x 24.24 ops/sec ±0.36% (61 runs sampled)
* sharp-file-file x 97.15 ops/sec ±0.44% (80 runs sampled)
* sharp-file-buffer x __98.51 ops/sec__ ±0.42% (80 runs sampled)

* sharp-file-buffer-sharpen x 56.99 ops/sec ±5.43% (57 runs sampled)
* sharp-file-buffer-progressive x 64.89 ops/sec ±0.42% (79 runs sampled)
* sharp-file-buffer-sequentialRead x 64.13 ops/sec ±0.40% (78 runs sampled)

### PNG

* imagemagick x 4.31 ops/sec ±0.27% (26 runs sampled)
* gm-file-file x 17.89 ops/sec ±0.21% (86 runs sampled)
* gm-file-buffer x 14.74 ops/sec ±0.15% (73 runs sampled)
 
* sharp-buffer-file x 4.97 ops/sec ±120.47% (26 runs sampled)
* sharp-buffer-buffer x 13.00 ops/sec ±0.53% (65 runs sampled)
* sharp-file-file x 53.00 ops/sec ±7.15% (88 runs sampled)
* sharp-file-buffer x __55.43 ops/sec__ ±0.65% (89 runs sampled)
 
* sharp-file-buffer-sharpen x 45.37 ops/sec ±0.38% (74 runs sampled)
* sharp-file-buffer-progressive x 55.49 ops/sec ±0.45% (89 runs sampled)
* sharp-file-buffer-sequentialRead x 32.27 ops/sec ±0.29% (79 runs sampled)

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
