# sharp

_adj_

1. clearly defined; distinct: a sharp photographic image. 
2. quick, brisk, or spirited. 
3. shrewd or astute: a sharp bargainer. 
4. (Informal.) very stylish: a sharp dresser; a sharp jacket. 

The typical use case for this high speed Node.js module is to convert large JPEG and PNG images to smaller JPEG and PNG images of varying dimensions.

It is somewhat opinionated in that it only deals with JPEG and PNG images, always obeys the requested dimensions by either cropping or embedding and insists on a mild sharpen of the resulting image.

Under the hood you'll find the blazingly fast [libvips](https://github.com/jcupitt/libvips) image processing library, originally created in 1989 at Birkbeck College and currently maintained by the University of Southampton.

Performance is 12x-15x faster than ImageMagick and 4x-6x faster than GraphicsMagick, based mainly on the number of CPU cores available.

## Prerequisites

* Node.js v0.8+
* node-gyp
* [libvips](https://github.com/jcupitt/libvips) v7.37+

For the sharpest results, please compile libvips from source.

If you prefer to run a stable, package-managed environment such as Ubuntu 12.04 LTS, [v0.0.3](https://github.com/lovell/sharp/tree/v0.0.3) will work with the libvips-dev package.

## Install

	npm install sharp

## Usage

	var sharp = require("sharp");

### crop(input, output, width, height, callback)

Scale and crop to `width` x `height` calling `callback` when complete.

```javascript
sharp.crop("input.jpg", "output.jpg", 300, 200, function(err) {
  if (err) {
    throw err;
  }
  // output.jpg is a 300 pixels wide and 200 pixels high image
  // containing a scaled and cropped version of input.jpg
});
```

```javascript
sharp.crop("input.jpg", sharp.buffer.jpeg, 300, 200, function(err, buffer) {
  if (err) {
    throw err;
  }
  // buffer contains JPEG image data
});
```

```javascript
sharp.crop("input.jpg", sharp.buffer.png, 300, 200, function(err, buffer) {
  if (err) {
    throw err;
  }
  // buffer contains PNG image data (converted from JPEG)
});
```

### embedWhite(input, output, width, height, callback)

Scale and embed to `width` x `height` using a white canvas calling `callback` when complete.

```javascript
sharp.embedWhite("input.jpg", "output.jpg", 200, 300, function(err) {
  if (err) {
    throw err;
  }
  // output.jpg is a 200 pixels wide and 300 pixels high image
  // containing a scaled version of input.png embedded on a white canvas
});
```

```javascript
sharp.embedWhite("input.jpg", sharp.buffer.jpeg, 200, 300, function(err, buffer) {
  if (err) {
    throw err;
  }
  // buffer contains JPEG image data
});
```

### embedBlack(input, output, width, height, callback)

Scale and embed to `width` x `height` using a black canvas calling `callback` when complete.

```javascript
sharp.embedBlack("input.png", "output.png", 200, 300, function(err) {
  if (err) {
    throw err;
  }
  // output.png is a 200 pixels wide and 300 pixels high image
  // containing a scaled version of input.png embedded on a black canvas
});
```

### Parameters common to all methods

#### input

String containing the filename to read from.

#### output

One of:
* String containing the filename to write to.
* `sharp.buffer.jpeg` to pass a Buffer containing JPEG image data to `callback`.
* `sharp.buffer.png` to pass a Buffer containing PNG image data to `callback`.

## Testing

	npm test

## Performance

Test environment:

* AMD Athlon 4 core 3.3GHz 512KB L2 CPU 1333 DDR3
* libvips 7.37
* libjpeg-turbo8 1.3.0
* libpng 1.6.6
* zlib1g 1.2.7

#### JPEG

* imagemagick x 5.53 ops/sec ±0.55% (31 runs sampled)
* gm x 10.86 ops/sec ±0.43% (56 runs sampled)
* epeg x 28.07 ops/sec ±0.07% (70 runs sampled)
* sharp-file x 72.01 ops/sec ±7.19% (74 runs sampled)
* sharp-buffer x 75.73 ops/sec ±0.44% (75 runs sampled)

#### PNG

* imagemagick x 4.65 ops/sec ±0.37% (27 runs sampled)
* gm x 21.65 ops/sec ±0.18% (56 runs sampled)
* sharp-file x 43.80 ops/sec ±6.81% (75 runs sampled)
* sharp-buffer x 45.67 ops/sec ±0.41% (75 runs sampled)

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
