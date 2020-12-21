# Performance

A test to benchmark the performance of this module relative to alternatives.

## The contenders

* [jimp](https://www.npmjs.com/package/jimp) v0.16.1 - Image processing in pure JavaScript. Provides bicubic interpolation.
* [mapnik](https://www.npmjs.org/package/mapnik) v4.5.5 - Whilst primarily a map renderer, Mapnik contains bitmap image utilities.
* [imagemagick](https://www.npmjs.com/package/imagemagick) v0.1.3 - Supports filesystem only and "*has been unmaintained for a long time*".
* [gm](https://www.npmjs.com/package/gm) v1.23.1 - Fully featured wrapper around GraphicsMagick's `gm` command line utility.
* sharp v0.27.0 / libvips v8.10.5 - Caching within libvips disabled to ensure a fair comparison.

## The task

Decompress a 2725x2225 JPEG image,
resize to 720x588 using Lanczos 3 resampling (where available),
then compress to JPEG at a "quality" setting of 80.

## Test environment

* AWS EC2 eu-west-1 [c5d.large](https://aws.amazon.com/ec2/instance-types/c5/) (2x Xeon Platinum 8275CL CPU @ 3.00GHz)
* Ubuntu 20.10 (ami-046cdbcee95cdd75c)
* Node.js v14.15.3

## Results

| Module             | Input  | Output | Ops/sec | Speed-up |
| :----------------- | :----- | :----- | ------: | -------: |
| jimp               | buffer | buffer |    0.77 |      1.0 |
| mapnik             | buffer | buffer |    3.39 |      4.4 |
| gm                 | buffer | buffer |    4.30 |      5.6 |
| gm                 | file   | file   |    4.33 |      5.6 |
| imagemagick        | file   | file   |    4.39 |      5.7 |
| sharp              | stream | stream |   23.81 |     30.9 |
| sharp              | file   | file   |   25.09 |     32.6 |
| sharp              | buffer | buffer |   25.60 |     33.2 |

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
