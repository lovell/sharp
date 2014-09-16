# sharp

* [Installation](https://github.com/lovell/sharp#installation)
* [Usage examples](https://github.com/lovell/sharp#usage-examples)
* [API](https://github.com/lovell/sharp#api)
* [Testing](https://github.com/lovell/sharp#testing)
* [Performance](https://github.com/lovell/sharp#performance)
* [Thanks](https://github.com/lovell/sharp#thanks)
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

	sudo apt-get install automake build-essential git gobject-introspection gtk-doc-tools libglib2.0-dev libjpeg-turbo8-dev libpng12-dev libwebp-dev libtiff5-dev libexif-dev libxml2-dev swig libmagickwand-dev
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

### Install libvips on Redhat/Centos Linux

#### Centos 6

	sudo yum groupinstall -y "Development Tools"
	sudo yum install -y gtk-doc libxml2-devel libjpeg-turbo-devel libpng-devel libtiff-devel libexif-devel ImageMagick-devel
	sudo yum install -y http://li.nux.ro/download/nux/dextop/el6/x86_64/nux-dextop-release-0-2.el6.nux.noarch.rpm
	sudo yum install -y --enablerepo=nux-dextop gobject-introspection-devel
	sudo yum install -y http://rpms.famillecollet.com/enterprise/remi-release-6.rpm
	sudo yum install -y --enablerepo=remi libwebp-devel
	git clone https://github.com/jcupitt/libvips.git
	cd libvips
	git checkout 7.40
	./bootstrap.sh
	./configure --prefix=/usr --enable-docs=no --enable-debug=no --enable-cxx=yes --without-orc --without-python --without-fftw
	make
	sudo make install
	sudo ldconfig

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
var transformer = sharp().resize(300, 200).crop(sharp.gravity.north);
readableStream.pipe(transformer).pipe(writableStream);
// Read image data from readableStream, resize and write image data to writableStream
```

```javascript
var image = sharp(inputJpg);
image.metadata(function(err, metadata) {
  image.resize(metadata.width / 2).webp().toBuffer(function(err, outputBuffer, info) {
    // outputBuffer contains a WebP image half the width and height of the original JPEG
  });
});
```

```javascript
var pipeline = sharp()
  .rotate()
  .resize(null, 200)
  .progressive()
  .toBuffer(function(err, outputBuffer, info) {
    if (err) {
      throw err;
    }
    // outputBuffer contains 200px high progressive JPEG image data,
    // auto-rotated using EXIF Orientation tag
    // info.width and info.height contain the dimensions of the resized image
  });
readableStream.pipe(pipeline);
```

```javascript
sharp('input.png')
  .rotate(180)
  .resize(300)
  .sharpen()
  .withMetadata()
  .quality(90)
  .webp()
  .toBuffer()
  .then(function(outputBuffer) {
    // outputBuffer contains 300px wide, upside down, sharpened,
    // with metadata, 90% quality WebP image data
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
sharp(inputBuffer)
  .resize(200, 300)
  .interpolateWith(sharp.interpolator.nohalo)
  .embedWhite()
  .toFile('output.tiff')
  .then(function() {
    // output.tiff is a 200 pixels wide and 300 pixels high image
    // containing a bicubic scaled version, embedded on a white canvas,
    // of the image data in inputBuffer
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
sharp(inputBuffer).resize(200, 200).max().jpeg().toBuffer().then(function(outputBuffer) {
  // outputBuffer contains JPEG image data no wider than 200 pixels and no higher
  // than 200 pixels regardless of the inputBuffer image dimensions
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

#### metadata([callback])

Fast access to image metadata without decoding any compressed image data.

`callback`, if present, gets the arguments `(err, metadata)` where `metadata` has the attributes:

* `format`: Name of decoder to be used to decompress image data e.g. `jpeg`, `png`, `webp` (for file-based input additionally `tiff` and `magick`)
* `width`: Number of pixels wide
* `height`: Number of pixels high
* `space`: Name of colour space interpretation e.g. `srgb`, `rgb`, `scrgb`, `cmyk`, `lab`, `xyz`, `b-w` [...](https://github.com/jcupitt/libvips/blob/master/libvips/iofuncs/enumtypes.c#L502)
* `channels`: Number of bands e.g. `3` for sRGB, `4` for CMYK
* `orientation`: Number value of the EXIF Orientation header, if present

A Promises/A+ promise is returned when `callback` is not provided.

#### sequentialRead()

An advanced setting that switches the libvips access method to `VIPS_ACCESS_SEQUENTIAL`. This will reduce memory usage and can improve performance on some systems.

### Image transformation options

#### resize(width, [height])

Scale output to `width` x `height`. By default, the resized image is cropped to the exact size specified.

`width` is the Number of pixels wide the resultant image should be. Use `null` or `undefined` to auto-scale the width to match the height.

`height` is the Number of pixels high the resultant image should be. Use `null` or `undefined` to auto-scale the height to match the width.

#### crop([gravity])

Crop the resized image to the exact size specified, the default behaviour.

`gravity`, if present, is an attribute of the `sharp.gravity` Object e.g. `sharp.gravity.north`.

Possible values are `north`, `east`, `south`, `west`, `center` and `centre`. The default gravity is `center`/`centre`.

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

Perform a mild sharpen of the output image. This typically reduces performance by 10%.

#### interpolateWith(interpolator)

Use the given interpolator for image resizing, where `interpolator` is an attribute of the `sharp.interpolator` Object e.g. `sharp.interpolator.bicubic`.

Possible interpolators, in order of performance, are:

* `nearest`: Use [nearest neighbour interpolation](http://en.wikipedia.org/wiki/Nearest-neighbor_interpolation), suitable for image enlargement only.
* `bilinear`: Use [bilinear interpolation](http://en.wikipedia.org/wiki/Bilinear_interpolation), the default and fastest image reduction interpolation.
* `bicubic`: Use [bicubic interpolation](http://en.wikipedia.org/wiki/Bicubic_interpolation), which typically reduces performance by 5%.
* `vertexSplitQuadraticBasisSpline`: Use [VSQBS interpolation](https://github.com/jcupitt/libvips/blob/master/libvips/resample/vsqbs.cpp#L48), which prevents "staircasing" and typically reduces performance by 5%.
* `locallyBoundedBicubic`: Use [LBB interpolation](https://github.com/jcupitt/libvips/blob/master/libvips/resample/lbb.cpp#L100), which prevents some "[acutance](http://en.wikipedia.org/wiki/Acutance)" and typically reduces performance by a factor of 2.
* `nohalo`: Use [Nohalo interpolation](http://eprints.soton.ac.uk/268086/), which prevents acutance and typically reduces performance by a factor of 3.

#### gamma([gamma])

Apply a gamma correction by reducing the encoding (darken) pre-resize at a factor of `1/gamma` then increasing the encoding (brighten) post-resize at a factor of `gamma`.

`gamma`, if present, is a Number betweem 1 and 3. The default value is `2.2`, a suitable approximation for sRGB images.

This can improve the perceived brightness of a resized image in non-linear colour spaces.

JPEG input images will not take advantage of the shrink-on-load performance optimisation when applying a gamma correction.

#### grayscale() / greyscale()

Convert to 8-bit greyscale; 256 shades of grey.

This is a linear operation. If the input image is in a non-linear colourspace such as sRGB, use `gamma()` with `greyscale()` for the best results.

The output image will still be web-friendly sRGB and contain three (identical) channels.

### Output options

#### jpeg()

Use JPEG format for the output image.

#### png()

Use PNG format for the output image.

#### webp()

Use WebP format for the output image.

#### quality(quality)

The output quality to use for lossy JPEG, WebP and TIFF output formats. The default quality is `80`.

`quality` is a Number between 1 and 100.

#### progressive()

Use progressive (interlace) scan for JPEG and PNG output. This typically reduces compression performance by 30% but results in an image that can be rendered sooner when decompressed.

#### withMetadata()

Include all metadata (ICC, EXIF, XMP) from the input image in the output image. The default behaviour is to strip all metadata.

#### compressionLevel(compressionLevel)

An advanced setting for the _zlib_ compression level of the lossless PNG output format. The default level is `6`.

`compressionLevel` is a Number between -1 and 9.

### Output methods

#### toFile(filename, [callback])

`filename` is a String containing the filename to write the image data to. The format is inferred from the extension, with JPEG, PNG, WebP and TIFF supported.

`callback`, if present, is called with two arguments `(err, info)` where:

* `err` contains an error message, if any.
* `info` contains the output image `format`, `width` and `height`.

A Promises/A+ promise is returned when `callback` is not provided.

#### toBuffer([callback])

Write image data to a Buffer, the format of which will match the input image by default. JPEG, PNG and WebP are supported.

`callback`, if present, gets three arguments `(err, buffer, info)` where:

* `err` is an error message, if any.
* `buffer` is the output image data.
* `info` contains the output image `format`, `width` and `height`.

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

#### sharp.concurrency([threads])

`threads`, if provided, is the Number of threads _libvips'_ should create for image processing. The default value is the number of CPU cores. A value of `0` will reset to this default.

This method always returns the current concurrency.

```javascript
var threads = sharp.concurrency(); // 4
sharp.concurrency(2); // 2
sharp.concurrency(0); // 4
```

#### sharp.counters()

Provides access to internal task counters.

* `queue` is the number of tasks this module has queued waiting for _libuv_ to provide a worker thread from its pool.
* `process` is the number of resize tasks currently being processed.

```javascript
var counters = sharp.counters(); // { queue: 2, process: 4 }
```

## Testing

### Ubuntu 12.04

[![Ubuntu 12.04 Build Status](https://travis-ci.org/lovell/sharp.png?branch=master)](https://travis-ci.org/lovell/sharp)

### Centos 6.5

[![Centos 6.5 Build Status](https://snap-ci.com/lovell/sharp/branch/master/build_image)](https://snap-ci.com/lovell/sharp/branch/master)

### It worked on my machine

```
npm test
```

Running the comparative performance tests requires _ImageMagick_ and _GraphicsMagick_.

```
brew install imagemagick
brew install graphicsmagick
```

```
sudo apt-get install -qq imagemagick graphicsmagick libmagick++-dev
```

```
sudo yum install ImageMagick
sudo yum install -y http://download.fedoraproject.org/pub/epel/6/x86_64/epel-release-6-8.noarch.rpm
sudo yum install -y --enablerepo=epel GraphicsMagick
```

## Performance

### Test environment

* AWS EC2 [c3.xlarge](http://aws.amazon.com/ec2/instance-types/#Compute_Optimized)
* Ubuntu 14.04
* libvips 7.40.8
* liborc 0.4.22

### The contenders

* [imagemagick-native](https://github.com/mash/node-imagemagick-native) v1.2.2 - Supports Buffers only and blocks main V8 thread whilst processing.
* [imagemagick](https://github.com/yourdeveloper/node-imagemagick) v0.1.3 - Supports filesystem only and "has been unmaintained for a long time".
* [gm](https://github.com/aheckmann/gm) v1.16.0 - Fully featured wrapper around GraphicsMagick.
* sharp v0.6.2 - Caching within libvips disabled to ensure a fair comparison.

### The task

Decompress a 2725x2225 JPEG image, resize and crop to 720x480, then compress to JPEG.

### Results

| Module                | Input  | Output | Ops/sec | Speed-up |
| :-------------------- | :----- | :----- | ------: | -------: |
| imagemagick-native    | buffer | buffer |    1.58 |        1 |
| imagemagick           | file   | file   |    6.23 |      3.9 |
| gm                    | buffer | file   |    5.32 |      3.4 |
| gm                    | buffer | buffer |    5.32 |      3.4 |
| gm                    | file   | file   |    5.36 |      3.4 |
| gm                    | file   | buffer |    5.36 |      3.4 |
| sharp                 | buffer | file   |   22.05 |     14.0 |
| sharp                 | buffer | buffer |   22.14 |     14.0 |
| sharp                 | file   | file   |   21.79 |     13.8 |
| sharp                 | file   | buffer |   21.90 |     13.9 |
| sharp                 | stream | stream |   20.87 |     13.2 |
| sharp +promise        | file   | buffer |   21.89 |     13.9 |
| sharp +sharpen        | file   | buffer |   19.69 |     12.5 |
| sharp +progressive    | file   | buffer |   16.93 |     10.7 |
| sharp +sequentialRead | file   | buffer |   21.60 |     13.7 |

You can expect greater performance with caching enabled (default) and using 8+ core machines.

## Thanks

This module would never have been possible without the help and code contributions of the following people:

* [John Cupitt](https://github.com/jcupitt)
* [Pierre Inglebert](https://github.com/pierreinglebert)
* [Jonathan Ong](https://github.com/jonathanong)
* [Chanon Sajjamanochai](https://github.com/chanon)
* [Juliano Julio](https://github.com/julianojulio)

Thank you!

## Licence

Copyright 2013, 2014 Lovell Fuller and contributors.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at [http://www.apache.org/licenses/LICENSE-2.0](http://www.apache.org/licenses/LICENSE-2.0.html)

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
