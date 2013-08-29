# sharp

_adj_

1. clearly defined; distinct: a sharp photographic image. 
2. quick, brisk, or spirited. 
3. shrewd or astute: a sharp bargainer. 
4. (Informal.) very stylish: a sharp dresser; a sharp jacket. 

The typical use case for this high speed Node.js module is to convert a large JPEG image to smaller JPEG images of varying dimensions.

It is somewhat opinionated in that it only deals with JPEG images, always obeys the requested dimensions by either cropping or embedding and insists on a mild sharpen of the resulting image.

Under the hood you'll find the blazingly fast [libvips](https://github.com/jcupitt/libvips) image processing library, originally created in 1989 at Birkbeck College and currently maintained by the University of Southampton.

Performance is 4x-8x faster than the imagemagick equivalent, based mainly on the number of CPU cores available.

## Prerequisites

Requires Node.js v0.8+, node-gyp and libvips-dev to build.

	sudo npm install -g node-gyp
	sudo apt-get install libvips-dev

Requires vips-7.xx.pc (installed with libvips-dev) to be symlinked as /usr/lib/pkgconfig/vips.pc

Ubuntu 12.04 LTS:

	sudo ln -s /usr/lib/pkgconfig/vips-7.26.pc /usr/lib/pkgconfig/vips.pc

Ubuntu 13.04 (64-bit):

	sudo ln -s /usr/lib/x86_64-linux-gnu/pkgconfig/vips-7.28.pc /usr/lib/pkgconfig/vips.pc

## Install

	npm install sharp

## Usage

	var sharp = require("sharp");

### crop(inputPath, outputPath, width, height, callback)

Scale and crop JPEG `inputPath` to `width` x `height` and write JPEG to `outputPath` calling `callback` when complete.

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

Scale and embed JPEG `inputPath` to `width` x `height` using a white canvas and write JPEG to `outputPath` calling `callback` when complete.

```javascript
sharp.embedWhite("input.jpg", "output.jpg", 200, 300, function(err) {
  if (err) {
    throw err;
  }
  // output.jpg is a 200 pixels wide and 300 pixels high image
  // containing a scaled version of input.jpg embedded on a white canvas
});
```

### embedBlack(inputPath, outputPath, width, height, callback)

Scale and embed JPEG `inputPath` to `width` x `height` using a black canvas and write JPEG to `outputPath` calling `callback` when complete.

```javascript
sharp.embedBlack("input.jpg", "output.jpg", 200, 300, function(err) {
  if (err) {
    throw err;
  }
  // output.jpg is a 200 pixels wide and 300 pixels high image
  // containing a scaled version of input.jpg embedded on a black canvas
});
```

## Testing [![Build Status](https://travis-ci.org/lovell/sharp.png?branch=master)](https://travis-ci.org/lovell/sharp)

	npm install --dev sharp
	npm test

## Performance

### AMD Athlon 4x core 3.3GHz 512KB L2

* imagemagick x 5.55 ops/sec ±0.68% (31 runs sampled)
* sharp x 24.49 ops/sec ±6.85% (64 runs sampled)

### AWS t1.micro

* imagemagick x 1.36 ops/sec ±0.96% (11 runs sampled)
* sharp x 12.42 ops/sec ±5.84% (64 runs sampled)

### AWS m1.medium

* imagemagick x 1.38 ops/sec ±0.45% (11 runs sampled)
* sharp x 12.66 ops/sec ±5.54% (65 runs sampled)

### AWS c1.medium

* imagemagick x 2.10 ops/sec ±0.67% (15 runs sampled)
* sharp x 18.97 ops/sec ±10.54% (52 runs sampled)

### AWS m3.xlarge

* imagemagick x 4.46 ops/sec ±0.33% (26 runs sampled)
* sharp x 28.89 ops/sec ±7.75% (74 runs sampled)
