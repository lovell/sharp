# Performance

A test to benchmark the performance of this module relative to alternatives.

## The contenders

* [jimp](https://www.npmjs.com/package/jimp) v0.16.0 - Image processing in pure JavaScript. Provides bicubic interpolation.
* [mapnik](https://www.npmjs.org/package/mapnik) v4.5.2 - Whilst primarily a map renderer, Mapnik contains bitmap image utilities.
* [imagemagick](https://www.npmjs.com/package/imagemagick) v0.1.3 - Supports filesystem only and "*has been unmaintained for a long time*".
* [gm](https://www.npmjs.com/package/gm) v1.23.1 - Fully featured wrapper around GraphicsMagick's `gm` command line utility.
* sharp v0.26.0 / libvips v8.10.0 - Caching within libvips disabled to ensure a fair comparison.

## The task

Decompress a 2725x2225 JPEG image,
resize to 720x588 using Lanczos 3 resampling (where available),
then compress to JPEG at a "quality" setting of 80.

## Test environment

* AWS EC2 eu-west-1 [c5d.large](https://aws.amazon.com/ec2/instance-types/c5/) (2x Xeon Platinum 8124M CPU @ 3.00GHz)
* Ubuntu 20.04 (ami-0f1d11c92a9467c07)
* Node.js v14.8.0

## Results

| Module             | Input  | Output | Ops/sec | Speed-up |
| :----------------- | :----- | :----- | ------: | -------: |
| jimp               | buffer | buffer |    0.75 |      1.0 |
| mapnik             | buffer | buffer |    3.00 |      4.0 |
| gm                 | buffer | buffer |    4.12 |      5.5 |
| gm                 | file   | file   |    4.13 |      5.5 |
| imagemagick        | file   | file   |    4.30 |      5.7 |
| sharp              | stream | stream |   22.37 |     29.8 |
| sharp              | file   | file   |   23.40 |     31.2 |
| sharp              | buffer | buffer |   24.01 |     32.0 |

Greater libvips performance can be expected with caching enabled (default)
and using 4+ core machines, especially those with larger L1/L2 CPU caches.

The I/O limits of the relevant (de)compression library will generally determine maximum throughput.

## Running the benchmark test

Requires _ImageMagick_, _GraphicsMagick_ and _Mapnik_:

```sh
brew install imagemagick
brew install graphicsmagick
brew install mapnik
```

```sh
sudo apt-get install imagemagick libmagick++-dev graphicsmagick libmapnik-dev
```

```sh
sudo yum install ImageMagick-devel ImageMagick-c++-devel GraphicsMagick mapnik-devel
```

```sh
git clone https://github.com/lovell/sharp.git
cd sharp
npm install
cd test/bench
npm install
npm test
```
