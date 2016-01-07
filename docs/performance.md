# Performance

### Test environment

* AWS EC2 [c4.xlarge](http://aws.amazon.com/ec2/instance-types/#c4) (4x E5-2666 v3 @2.90GHz)
* Amazon Linux 2015.09.1
* Node.js v5.1.0

### The contenders

* [jimp](https://www.npmjs.com/package/jimp) v0.2.19 - Image processing in pure JavaScript. Bilinear interpolation only.
* [lwip](https://www.npmjs.com/package/lwip) v0.0.8 - Wrapper around CImg, compiles dependencies from source.
* [imagemagick-native](https://www.npmjs.com/package/imagemagick-native) @5ab570e - Wrapper around libmagick++, supports Buffers only.
* [imagemagick](https://www.npmjs.com/package/imagemagick) v0.1.3 - Supports filesystem only and "*has been unmaintained for a long time*".
* [gm](https://www.npmjs.com/package/gm) v1.21.0 - Fully featured wrapper around GraphicsMagick's `gm` command line utility.
* sharp v0.12.0 / libvips v8.1.1 - Caching within libvips disabled to ensure a fair comparison.

### The task

Decompress a 2725x2225 JPEG image, resize to 720x480 using bicubic interpolation (where available), then compress to JPEG.

### Results

| Module             | Input  | Output | Ops/sec | Speed-up |
| :----------------- | :----- | :----- | ------: | -------: |
| jimp               | file   | file   |    0.99 |      1.0 |
| jimp               | buffer | buffer |    1.05 |      1.1 |
| lwip               | file   | file   |    1.13 |      1.1 |
| lwip               | buffer | buffer |    1.13 |      1.1 |
| imagemagick-native | buffer | buffer |    1.67 |      1.7 |
| imagemagick        | file   | file   |    5.19 |      5.2 |
| gm                 | buffer | buffer |    5.56 |      5.6 |
| gm                 | file   | file   |    5.59 |      5.6 |
| sharp              | stream | stream |   21.91 |     22.1 |
| sharp              | file   | file   |   22.79 |     23.0 |
| sharp              | file   | buffer |   22.91 |     23.1 |
| sharp              | buffer | file   |   23.03 |     23.3 |
| sharp              | buffer | buffer |   23.15 |     23.4 |

Greater performance can be expected with caching enabled (default) and using 8+ core machines.

The I/O limits of the relevant (de)compression library will generally determine maximum throughput.

### Benchmark test prerequisites

Requires both _ImageMagick_ and _GraphicsMagick_:

```sh
brew install imagemagick
brew install graphicsmagick
```

```sh
sudo apt-get install imagemagick libmagick++-dev graphicsmagick
```

```sh
sudo yum install ImageMagick-devel ImageMagick-c++-devel GraphicsMagick
```

### Running the benchmark test

```sh
git clone https://github.com/lovell/sharp.git
cd sharp
npm install
cd test/bench
npm install
npm test
```
