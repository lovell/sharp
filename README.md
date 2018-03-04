# sharp

```sh
npm install sharp
```

```sh
yarn add sharp
```

The typical use case for this high speed Node.js module
is to convert large images in common formats to
smaller, web-friendly JPEG, PNG and WebP images of varying dimensions.

Resizing an image is typically 4x-5x faster than using the
quickest ImageMagick and GraphicsMagick settings.

Colour spaces, embedded ICC profiles and alpha transparency channels are all handled correctly.
Lanczos resampling ensures quality is not sacrificed for speed.

As well as image resizing, operations such as
rotation, extraction, compositing and gamma correction are available.

Most modern 64-bit OS X, Windows and Linux (glibc) systems running
Node versions 4, 6, 8 and 9
do not require any additional install or runtime dependencies.

## Examples

```javascript
const sharp = require('sharp');
```

```javascript
sharp(inputBuffer)
  .resize(320, 240)
  .toFile('output.webp', (err, info) => ... );
  // A Promises/A+ promise is returned when callback is not provided.
```

```javascript
sharp('input.jpg')
  .rotate()
  .resize(200)
  .toBuffer()
  .then( data => ... )
  .catch( err => ... );
```

```javascript
const roundedCorners = new Buffer(
  '<svg><rect x="0" y="0" width="200" height="200" rx="50" ry="50"/></svg>'
);

const roundedCornerResizer =
  sharp()
    .resize(200, 200)
    .overlayWith(roundedCorners, { cutout: true })
    .png();

readableStream
  .pipe(roundedCornerResizer)
  .pipe(writableStream);
```

[![Test Coverage](https://coveralls.io/repos/lovell/sharp/badge.png?branch=master)](https://coveralls.io/r/lovell/sharp?branch=master)

### Documentation

Visit [sharp.pixelplumbing.com](http://sharp.pixelplumbing.com/) for complete
[installation instructions](http://sharp.pixelplumbing.com/page/install),
[API documentation](http://sharp.pixelplumbing.com/page/api),
[benchmark tests](http://sharp.pixelplumbing.com/page/performance) and
[changelog](http://sharp.pixelplumbing.com/page/changelog).

### Contributing

A [guide for contributors](https://github.com/lovell/sharp/blob/master/CONTRIBUTING.md)
covers reporting bugs, requesting features and submitting code changes.

### Licence

Copyright 2013, 2014, 2015, 2016, 2017, 2018 Lovell Fuller and contributors.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at
[http://www.apache.org/licenses/LICENSE-2.0](http://www.apache.org/licenses/LICENSE-2.0.html)

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
