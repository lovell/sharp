# Performance

### Test environment

* AWS EC2 [c4.xlarge](http://aws.amazon.com/ec2/instance-types/#c4) (4x E5-2666 v3 @ 2.90GHz)
* Amazon Linux AMI 2016.03.1 (HVM), SSD Volume Type
* Node.js v6.2.0

### The contenders

* [jimp](https://www.npmjs.com/package/jimp) v0.2.24 - Image processing in pure JavaScript. Bilinear interpolation only.
* [lwip](https://www.npmjs.com/package/lwip) v0.0.9 - Wrapper around CImg, compiles dependencies from source.
* [imagemagick-native](https://www.npmjs.com/package/imagemagick-native) v1.9.2 - Wrapper around libmagick++, supports Buffers only.
* [imagemagick](https://www.npmjs.com/package/imagemagick) v0.1.3 - Supports filesystem only and "*has been unmaintained for a long time*".
* [gm](https://www.npmjs.com/package/gm) v1.22.0 - Fully featured wrapper around GraphicsMagick's `gm` command line utility.
* sharp v0.15.0 / libvips v8.3.1 - Caching within libvips disabled to ensure a fair comparison.

### The task

Decompress a 2725x2225 JPEG image,
resize to 720x480 using Lanczos 3 resampling (where available),
then compress to JPEG.

### Results

| Module             | Input  | Output | Ops/sec | Speed-up |
| :----------------- | :----- | :----- | ------: | -------: |
| jimp (bilinear)    | file   | file   |    0.94 |      1.0 |
| jimp (bilinear)    | buffer | buffer |    0.98 |      1.0 |
| lwip               | file   | file   |    1.14 |      1.2 |
| lwip               | buffer | buffer |    1.14 |      1.2 |
| imagemagick-native | buffer | buffer |    1.66 |      1.8 |
| imagemagick        | file   | file   |    5.08 |      5.4 |
| gm                 | buffer | buffer |    5.43 |      5.7 |
| gm                 | file   | file   |    5.46 |      5.8 |
| sharp              | stream | stream |   26.52 |     28.2 |
| sharp              | file   | file   |   28.16 |     30.0 |
| sharp              | file   | buffer |   28.27 |     30.1 |
| sharp              | buffer | file   |   28.42 |     30.2 |
| sharp              | buffer | buffer |   28.42 |     30.2 |

Greater libvips performance can be expected with caching enabled (default)
and using 8+ core machines, especially those with larger L1/L2 CPU caches.

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
