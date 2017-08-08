# sharp

The typical use case for this high speed Node.js module
is to convert large images in common formats to
smaller, web-friendly JPEG, PNG and WebP images of varying dimensions.

Resizing an image is typically 4x-5x faster than using the
quickest ImageMagick and GraphicsMagick settings.

Colour spaces, embedded ICC profiles and alpha transparency channels are all handled correctly.
Lanczos resampling ensures quality is not sacrificed for speed.

As well as image resizing, operations such as
rotation, extraction, compositing and gamma correction are available.

OS X, Windows (x64), Linux (x64, ARM) systems do not require
the installation of any external runtime dependencies.

[![Test Coverage](https://coveralls.io/repos/lovell/sharp/badge.png?branch=master)](https://coveralls.io/r/lovell/sharp?branch=master)

### Formats

This module supports reading JPEG, PNG, WebP, TIFF, GIF and SVG images.

Output images can be in JPEG, PNG, WebP and TIFF formats as well as uncompressed raw pixel data.

Streams, Buffer objects and the filesystem can be used for input and output.

A single input Stream can be split into multiple processing pipelines and output Streams.

Deep Zoom image pyramids can be generated,
suitable for use with "slippy map" tile viewers like
[OpenSeadragon](https://github.com/openseadragon/openseadragon)
and [Leaflet](https://github.com/turban/Leaflet.Zoomify).

### Fast

This module is powered by the blazingly fast
[libvips](https://github.com/jcupitt/libvips) image processing library,
originally created in 1989 at Birkbeck College
and currently maintained by
[John Cupitt](https://github.com/jcupitt).

Only small regions of uncompressed image data
are held in memory and processed at a time,
taking full advantage of multiple CPU cores and L1/L2/L3 cache.

Everything remains non-blocking thanks to _libuv_,
no child processes are spawned and Promises/A+ are supported.

### Optimal

Huffman tables are optimised when generating JPEG output images
without having to use separate command line tools like
[jpegoptim](https://github.com/tjko/jpegoptim) and
[jpegtran](http://jpegclub.org/jpegtran/).

PNG filtering can be disabled,
which for diagrams and line art often produces the same result
as [pngcrush](http://pmt.sourceforge.net/pngcrush/).

### Contributing

A [guide for contributors](https://github.com/lovell/sharp/blob/master/CONTRIBUTING.md)
covers reporting bugs, requesting features and submitting code changes.

### Credits

This module would never have been possible without
the help and code contributions of the following people:

* [John Cupitt](https://github.com/jcupitt)
* [Pierre Inglebert](https://github.com/pierreinglebert)
* [Jonathan Ong](https://github.com/jonathanong)
* [Chanon Sajjamanochai](https://github.com/chanon)
* [Juliano Julio](https://github.com/julianojulio)
* [Daniel Gasienica](https://github.com/gasi)
* [Julian Walker](https://github.com/julianwa)
* [Amit Pitaru](https://github.com/apitaru)
* [Brandon Aaron](https://github.com/brandonaaron)
* [Andreas Lind](https://github.com/papandreou)
* [Maurus Cuelenaere](https://github.com/mcuelenaere)
* [Linus Unnebäck](https://github.com/LinusU)
* [Victor Mateevitsi](https://github.com/mvictoras)
* [Alaric Holloway](https://github.com/skedastik)
* [Bernhard K. Weisshuhn](https://github.com/bkw)
* [David A. Carley](https://github.com/dacarley)
* [John Tobin](https://github.com/jtobinisaniceguy)
* [Kenton Gray](https://github.com/kentongray)
* [Felix Bünemann](https://github.com/felixbuenemann)
* [Samy Al Zahrani](https://github.com/salzhrani)
* [Chintan Thakkar](https://github.com/lemnisk8)
* [F. Orlando Galashan](https://github.com/frulo)
* [Kleis Auke Wolthuizen](https://github.com/kleisauke)
* [Matt Hirsch](https://github.com/mhirsch)
* [Rahul Nanwani](https://github.com/rnanwani)
* [Matthias Thoemmes](https://github.com/cmtt)
* [Patrick Paskaris](https://github.com/ppaskaris)
* [Jérémy Lal](https://github.com/kapouer)
* [Alice Monday](https://github.com/alice0meta)
* [Kristo Jorgenson](https://github.com/kristojorg)
* [Yves Bos](https://github.com/YvesBos)

Thank you!

### Licence

Copyright 2013, 2014, 2015, 2016, 2017 Lovell Fuller and contributors.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at
[http://www.apache.org/licenses/LICENSE-2.0](http://www.apache.org/licenses/LICENSE-2.0.html)

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
