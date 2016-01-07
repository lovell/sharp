# sharp

The typical use case for this high speed Node.js module
is to convert large images of many formats to
smaller, web-friendly JPEG, PNG and WebP images of varying dimensions.

Resizing an image is typically 4x faster than using the
quickest ImageMagick and GraphicsMagick settings.

Colour spaces, embedded ICC profiles and alpha transparency channels are all handled correctly.
Bicubic interpolation with Lanczos anti-alias filtering ensures quality is not sacrificed for speed.

As well as image resizing, operations such as
rotation, extraction, compositing and gamma correction are available.

Most Windows (x64), Linux and ARMv6+ systems do not require
the installation of any external runtime dependencies.

Use with OS X is as simple as running `brew install homebrew/science/vips`
to install the libvips dependency.

[![Test Coverage](https://coveralls.io/repos/lovell/sharp/badge.png?branch=master)](https://coveralls.io/r/lovell/sharp?branch=master)

### Documentation

Visit [sharp.dimens.io](http://sharp.dimens.io/) for complete
[installation instructions](http://sharp.dimens.io/page/install),
[API documentation](http://sharp.dimens.io/page/api),
[benchmark tests](http://sharp.dimens.io/page/performance) and
[changelog](http://sharp.dimens.io/page/changelog).

### Contributing

A [guide for contributors](https://github.com/lovell/sharp/blob/master/CONTRIBUTING.md)
covers reporting bugs, requesting features and submitting code changes.

### Licence

Copyright 2013, 2014, 2015, 2016 Lovell Fuller and contributors.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at
[http://www.apache.org/licenses/LICENSE-2.0](http://www.apache.org/licenses/LICENSE-2.0.html)

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
