# sharp (_adj_)

1. clearly defined; distinct: a sharp photographic image. 
2. quick, brisk, or spirited. 
3. shrewd or astute: a sharp bargainer. 
4. (Informal.) very stylish: a sharp dresser; a sharp jacket. 

The typical use case for this high performance Node.js module is to convert a large JPEG image to smaller JPEG images of varying dimensions.

It is somewhat opinionated in that it only deals with JPEG images, always obeys the requested dimensions by either cropping or embedding and insists on a mild sharpen of the resulting image.

Under the hood you'll find the blazingly fast [libvips](https://github.com/jcupitt/libvips) image processing library, originally created in 1989 at Birkbeck College and currently maintained by the University of Southampton.

## Prerequisites

Requires node-gyp and libvips-dev to build.

	sudo npm install -g node-gyp
	sudo apt-get install libvips-dev

Requires vips-7.xx.pc (installed with libvips-dev) to be symlinked as /usr/lib/pkgconfig/vips.pc

Ubuntu 12.04 LTS:

	sudo ln -s /usr/lib/pkgconfig/vips-7.26.pc /usr/lib/pkgconfig/vips.pc

Ubuntu 13.04:

	sudo ln -s /usr/lib/x86_64-linux-gnu/pkgconfig/vips-7.28.pc /usr/lib/pkgconfig/vips.pc

## Install

	npm install sharp

## Usage

```javascript
var sharp = require("sharp");
var cropLandscape = sharp.resize("input.jpg", "output.jpg", 300, 200, "c");
var embedPortraitWhiteBorder = sharp.resize("input.jpg", "output.jpg", 200, 300, "w");
var embedPortraitBlackBorder = sharp.resize("input.jpg", "output.jpg", 200, 300, "b");
```

## Testing [![Build Status](https://travis-ci.org/lovell/sharp.png?branch=master)](https://travis-ci.org/lovell/sharp)

	npm test
