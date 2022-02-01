# sharp

<img src="https://cdn.jsdelivr.net/gh/lovell/sharp@master/docs/image/sharp-logo.svg" width="160" height="160" alt="sharp logo" align="right">

The typical use case for this high speed Node.js module
is to convert large images in common formats to
smaller, web-friendly JPEG, PNG, WebP, GIF and AVIF images of varying dimensions.

Resizing an image is typically 4x-5x faster than using the
quickest ImageMagick and GraphicsMagick settings
due to its use of [libvips](https://github.com/libvips/libvips).

Colour spaces, embedded ICC profiles and alpha transparency channels are all handled correctly.
Lanczos resampling ensures quality is not sacrificed for speed.

As well as image resizing, operations such as
rotation, extraction, compositing and gamma correction are available.

Most modern macOS, Windows and Linux systems running Node.js >= 12.13.0
do not require any additional install or runtime dependencies.

### Formats

This module supports reading JPEG, PNG, WebP, GIF, AVIF, TIFF and SVG images.

Output images can be in JPEG, PNG, WebP, GIF, AVIF and TIFF formats as well as uncompressed raw pixel data.

Streams, Buffer objects and the filesystem can be used for input and output.

A single input Stream can be split into multiple processing pipelines and output Streams.

Deep Zoom image pyramids can be generated,
suitable for use with "slippy map" tile viewers like
[OpenSeadragon](https://github.com/openseadragon/openseadragon).

### Fast

This module is powered by the blazingly fast
[libvips](https://github.com/libvips/libvips) image processing library,
originally created in 1989 at Birkbeck College
and currently maintained by a small team led by
[John Cupitt](https://github.com/jcupitt).

Only small regions of uncompressed image data
are held in memory and processed at a time,
taking full advantage of multiple CPU cores and L1/L2/L3 cache.

Everything remains non-blocking thanks to _libuv_,
no child processes are spawned and Promises/async/await are supported.

### Optimal

The features of `mozjpeg` and `pngquant` can be used
to optimise the file size of JPEG and PNG images respectively,
without having to invoke separate `imagemin` processes.

Huffman tables are optimised when generating JPEG output images
without having to use separate command line tools like
[jpegoptim](https://github.com/tjko/jpegoptim) and
[jpegtran](http://jpegclub.org/jpegtran/).

PNG filtering is disabled by default,
which for diagrams and line art often produces the same result
as [pngcrush](https://pmt.sourceforge.io/pngcrush/).

### Contributing

A [guide for contributors](https://github.com/lovell/sharp/blob/master/.github/CONTRIBUTING.md)
covers reporting bugs, requesting features and submitting code changes.

### Licensing

Copyright 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022 Lovell Fuller and contributors.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at
[https://www.apache.org/licenses/LICENSE-2.0](https://www.apache.org/licenses/LICENSE-2.0)

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
