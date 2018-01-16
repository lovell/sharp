# Performance

### Test environment

* AWS EC2 eu-west-1 [c5.large](https://aws.amazon.com/ec2/instance-types/c5/) (2x Xeon Platinum 8124M CPU @ 3.00GHz)
* Ubuntu 17.10 (hvm:ebs-ssd, 20180102, ami-0741d47e)
* Node.js v8.9.4

### The contenders

* [jimp](https://www.npmjs.com/package/jimp) v0.2.28 - Image processing in pure JavaScript. Bilinear interpolation only.
* [pajk-lwip](https://www.npmjs.com/package/pajk-lwip) v0.2.0 (fork) - Wrapper around CImg that compiles dependencies from source.
* [mapnik](https://www.npmjs.org/package/mapnik) v3.6.2 - Whilst primarily a map renderer, Mapnik contains bitmap image utilities.
* [imagemagick-native](https://www.npmjs.com/package/imagemagick-native) v1.9.3 - Wrapper around libmagick++, supports Buffers only.
* [imagemagick](https://www.npmjs.com/package/imagemagick) v0.1.3 - Supports filesystem only and "*has been unmaintained for a long time*".
* [gm](https://www.npmjs.com/package/gm) v1.23.1 - Fully featured wrapper around GraphicsMagick's `gm` command line utility.
* [images](https://www.npmjs.com/package/images) v3.0.1 - Compiles dependencies from source. Provides bicubic interpolation.
* sharp v0.19.0 / libvips v8.6.1 - Caching within libvips disabled to ensure a fair comparison.

### The task

Decompress a 2725x2225 JPEG image,
resize to 720x588 using Lanczos 3 resampling (where available),
then compress to JPEG at a "quality" setting of 80.

### Results

| Module             | Input  | Output | Ops/sec | Speed-up |
| :----------------- | :----- | :----- | ------: | -------: |
| jimp (bilinear)    | buffer | buffer |    1.14 |      1.0 |
| lwip               | buffer | buffer |    1.86 |      1.6 |
| mapnik             | buffer | buffer |    3.34 |      2.9 |
| imagemagick-native | buffer | buffer |    4.13 |      3.6 |
| gm                 | buffer | buffer |    4.21 |      3.7 |
| gm                 | file   | file   |    4.27 |      3.7 |
| imagemagick        | file   | file   |    4.67 |      4.1 |
| images (bicubic)   | file   | file   |    6.22 |      5.5 |
| sharp              | stream | stream |   24.43 |     21.4 |
| sharp              | file   | file   |   25.97 |     22.7 |
| sharp              | file   | buffer |   26.00 |     22.8 |
| sharp              | buffer | file   |   26.33 |     23.0 |
| sharp              | buffer | buffer |   26.43 |     23.1 |

Greater libvips performance can be expected with caching enabled (default)
and using 8+ core machines, especially those with larger L1/L2 CPU caches.

The I/O limits of the relevant (de)compression library will generally determine maximum throughput.

### Benchmark test prerequisites

Requires _ImageMagick_, _GraphicsMagick_ and _Mapnik_:

```sh
brew install imagemagick
brew install graphicsmagick
brew install mapnik
```

```sh
sudo apt-get install imagemagick libmagick++-dev graphicsmagick mapnik-dev
```

```sh
sudo yum install ImageMagick-devel ImageMagick-c++-devel GraphicsMagick mapnik-devel
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
