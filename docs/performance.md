# Performance

### Test environment

* AWS EC2 [c4.xlarge](http://aws.amazon.com/ec2/instance-types/#c4) (4x E5-2666 v3 @2.90GHz)
* Amazon Linux 2015.09.1
* Node.js v5.5.0

### The contenders

* [jimp](https://www.npmjs.com/package/jimp) v0.2.20 - Image processing in pure JavaScript. Bilinear interpolation only.
* [lwip](https://www.npmjs.com/package/lwip) v0.0.8 - Wrapper around CImg, compiles dependencies from source.
* [imagemagick-native](https://www.npmjs.com/package/imagemagick-native) @47c7329 - Wrapper around libmagick++, supports Buffers only.
* [imagemagick](https://www.npmjs.com/package/imagemagick) v0.1.3 - Supports filesystem only and "*has been unmaintained for a long time*".
* [gm](https://www.npmjs.com/package/gm) v1.21.0 - Fully featured wrapper around GraphicsMagick's `gm` command line utility.
* sharp v0.13.0 / libvips v8.2.2 - Caching within libvips disabled to ensure a fair comparison.

### The task

Decompress a 2725x2225 JPEG image, resize to 720x480 using bicubic interpolation (where available), then compress to JPEG.

### Results

| Module             | Input  | Output | Ops/sec | Speed-up |
| :----------------- | :----- | :----- | ------: | -------: |
| jimp (bilinear)    | file   | file   |    1.04 |      1.0 |
| jimp (bilinear)    | buffer | buffer |    1.07 |      1.0 |
| lwip               | file   | file   |    1.13 |      1.1 |
| lwip               | buffer | buffer |    1.13 |      1.1 |
| imagemagick-native | buffer | buffer |    1.65 |      1.6 |
| imagemagick        | file   | file   |    5.02 |      4.8 |
| gm                 | buffer | buffer |    5.36 |      5.2 |
| gm                 | file   | file   |    5.39 |      5.2 |
| sharp              | stream | stream |   22.00 |     21.2 |
| sharp              | file   | file   |   22.87 |     22.0 |
| sharp              | file   | buffer |   23.03 |     22.1 |
| sharp              | buffer | file   |   23.10 |     22.2 |
| sharp              | buffer | buffer |   23.21 |     22.3 |

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
