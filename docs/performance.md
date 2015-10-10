# Performance

### Test environment

* AWS EC2 [c4.xlarge](http://aws.amazon.com/ec2/instance-types/#c4)
* Amazon Linux AMI 2015.09
* Node.js v4.1.2

### The contenders

* [jimp](https://www.npmjs.com/package/jimp) v0.2.8 - Image processing in pure JavaScript.
* [lwip](https://www.npmjs.com/package/lwip) v0.0.8 - Wrapper around CImg, compiles dependencies from source.
* ~~[imagemagick-native](https://www.npmjs.com/package/imagemagick-native)~~ - Wrapper around libmagick++, supports Buffers only. Does not currently work with Node.js v4.
* [imagemagick](https://www.npmjs.com/package/imagemagick) v0.1.3 - Supports filesystem only and "*has been unmaintained for a long time*".
* [gm](https://www.npmjs.com/package/gm) v1.20.0 - Fully featured wrapper around GraphicsMagick's `convert` command line utility.
* sharp v0.11.3 / libvips v8.1.0 - Caching within libvips disabled to ensure a fair comparison.

### The task

Decompress a 2725x2225 JPEG image, resize to 720x480 using bilinear interpolation, then compress to JPEG.

### Results

| Module      | Input  | Output | Ops/sec | Speed-up |
| :---------- | :----- | :----- | ------: | -------: |
| jimp        | file   | file   |    0.94 |      1.0 |
| jimp        | buffer | buffer |    1.12 |      1.2 |
| lwip        | file   | file   |    1.12 |      1.2 |
| lwip        | buffer | buffer |    1.13 |      1.2 |
| gm          | buffer | buffer |    5.50 |      5.9 |
| gm          | file   | file   |    5.55 |      5.9 |
| imagemagick | file   | file   |    8.66 |      9.2 |
| sharp       | stream | stream |   16.33 |     17.4 |
| sharp       | file   | file   |   16.88 |     18.0 |
| sharp       | file   | buffer |   16.90 |     18.1 |
| sharp       | buffer | file   |   16.99 |     18.1 |
| sharp       | buffer | buffer |   17.06 |     18.1 |

Greater performance can be expected with caching enabled (default) and using 8+ core machines.

The I/O limits of the relevant (de)compression library will generally determine maximum throughput.

### Benchmark test prerequisites

Requires both _ImageMagick_ and _GraphicsMagick_:

```sh
brew install imagemagick
brew install graphicsmagick
```

```sh
sudo apt-get install imagemagick graphicsmagick libmagick++-dev
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
