# Performance

### Test environment

* AWS EC2 [c4.xlarge](http://aws.amazon.com/ec2/instance-types/#c4) (4x E5-2666 v3 @ 2.90GHz)
* Ubuntu 16.04.1 LTS (HVM, SSD)
* Node.js v6.9.1

### The contenders

* [jimp](https://www.npmjs.com/package/jimp) v0.2.27 - Image processing in pure JavaScript. Bilinear interpolation only.
* [lwip](https://www.npmjs.com/package/lwip) v0.0.9 - Wrapper around CImg. Compiles outdated, insecure dependencies from source.
* [mapnik](https://www.npmjs.org/package/mapnik) v3.5.14 - Whilst primarily a map renderer, Mapnik contains bitmap image utilities.
* [imagemagick-native](https://www.npmjs.com/package/imagemagick-native) v1.9.3 - Wrapper around libmagick++, supports Buffers only.
* [imagemagick](https://www.npmjs.com/package/imagemagick) v0.1.3 - Supports filesystem only and "*has been unmaintained for a long time*".
* [gm](https://www.npmjs.com/package/gm) v1.23.0 - Fully featured wrapper around GraphicsMagick's `gm` command line utility.
* sharp v0.17.0 / libvips v8.4.2 - Caching within libvips disabled to ensure a fair comparison.

### The task

Decompress a 2725x2225 JPEG image,
resize to 720x480 using Lanczos 3 resampling (where available),
then compress to JPEG at a "quality" setting of 80.

### Results

| Module             | Input  | Output | Ops/sec | Speed-up |
| :----------------- | :----- | :----- | ------: | -------: |
| jimp (bilinear)    | buffer | buffer |    1.05 |      1.0 |
| lwip               | buffer | buffer |    2.32 |      2.2 |
| mapnik             | buffer | buffer |    2.90 |      2.8 |
| imagemagick-native | buffer | buffer |    4.00 |      3.8 |
| imagemagick        | file   | file   |    7.16 |      6.8 |
| gm                 | buffer | buffer |    7.12 |      6.8 |
| gm                 | file   | file   |    7.16 |      6.8 |
| sharp              | stream | stream |   27.97 |     26.6 |
| sharp              | file   | file   |   28.69 |     27.3 |
| sharp              | buffer | file   |   28.81 |     27.4 |
| sharp              | file   | buffer |   28.99 |     27.6 |
| sharp              | buffer | buffer |   29.17 |     27.8 |

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
