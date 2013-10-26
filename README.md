# sharp

_adj_

1. clearly defined; distinct: a sharp photographic image. 
2. quick, brisk, or spirited. 
3. shrewd or astute: a sharp bargainer. 
4. (Informal.) very stylish: a sharp dresser; a sharp jacket. 

The typical use case for this high speed Node.js module is to convert large JPEG and PNG images to smaller JPEG and PNG images of varying dimensions.

It is somewhat opinionated in that it only deals with JPEG and PNG images, always obeys the requested dimensions by either cropping or embedding and insists on a mild sharpen of the resulting image.

Under the hood you'll find the blazingly fast [libvips](https://github.com/jcupitt/libvips) image processing library, originally created in 1989 at Birkbeck College and currently maintained by the University of Southampton.

Performance is 4x-8x faster than ImageMagick and 2x-4x faster than GraphicsMagick, based mainly on the number of CPU cores available.

## Prerequisites

* Node.js v0.8+
* node-gyp
* libvips-dev 7.28+ (7.36+ for optimal JPEG Huffman coding)

```
sudo npm install -g node-gyp
sudo apt-get install libvips-dev
```

When installed as a package, please symlink `vips-7.28.pc` (or later, installed with libvips-dev) as `/usr/lib/pkgconfig/vips.pc`. To do this in Ubuntu 13.04 (64-bit), use:

	sudo ln -s /usr/lib/x86_64-linux-gnu/pkgconfig/vips-7.28.pc /usr/lib/pkgconfig/vips.pc

## Install

	npm install sharp

## Usage

	var sharp = require("sharp");

### crop(inputPath, outputPath, width, height, callback)

Scale and crop `inputPath` to `width` x `height` and write to `outputPath` calling `callback` when complete.

Example:

```javascript
sharp.crop("input.jpg", "output.jpg", 300, 200, function(err) {
  if (err) {
    throw err;
  }
  // output.jpg is a 300 pixels wide and 200 pixels high image
  // containing a scaled and cropped version of input.jpg
});
```

### embedWhite(inputPath, outputPath, width, height, callback)

Scale and embed `inputPath` to `width` x `height` using a white canvas and write to `outputPath` calling `callback` when complete.

```javascript
sharp.embedWhite("input.jpg", "output.png", 200, 300, function(err) {
  if (err) {
    throw err;
  }
  // output.jpg is a 200 pixels wide and 300 pixels high image
  // containing a scaled version of input.png embedded on a white canvas
});
```

### embedBlack(inputPath, outputPath, width, height, callback)

Scale and embed `inputPath` to `width` x `height` using a black canvas and write to `outputPath` calling `callback` when complete.

```javascript
sharp.embedBlack("input.png", "output.png", 200, 300, function(err) {
  if (err) {
    throw err;
  }
  // output.png is a 200 pixels wide and 300 pixels high image
  // containing a scaled version of input.png embedded on a black canvas
});
```

## Testing

	npm install --dev sharp
	npm test

## Performance

Test environment:

* AMD Athlon 4 core 3.3GHz 512KB L2 CPU 1333 DDR3
* libvips 7.36
* libjpeg-turbo8 1.2.1
* libpng 1.6.6
* zlib1g 1.2.7

#### JPEG

* imagemagick x 5.53 ops/sec ±0.55% (31 runs sampled)
* gm x 10.86 ops/sec ±0.43% (56 runs sampled)
* epeg x 28.07 ops/sec ±0.07% (70 runs sampled)
* sharp x 31.60 ops/sec ±8.80% (80 runs sampled)

#### PNG

* imagemagick x 4.65 ops/sec ±0.37% (27 runs sampled)
* gm x 21.65 ops/sec ±0.18% (56 runs sampled)
* sharp x 39.47 ops/sec ±6.78% (68 runs sampled)

## Licence

Copyright 2013 Lovell Fuller

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at [http://www.apache.org/licenses/LICENSE-2.0](http://www.apache.org/licenses/LICENSE-2.0.html)

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
