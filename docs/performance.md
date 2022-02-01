# Performance

A test to benchmark the performance of this module relative to alternatives.

## The contenders

* [jimp](https://www.npmjs.com/package/jimp) v0.16.1 - Image processing in pure JavaScript. Provides bicubic interpolation.
* [mapnik](https://www.npmjs.org/package/mapnik) v4.5.9 - Whilst primarily a map renderer, Mapnik contains bitmap image utilities.
* [imagemagick](https://www.npmjs.com/package/imagemagick) v0.1.3 - Supports filesystem only and "*has been unmaintained for a long time*".
* [gm](https://www.npmjs.com/package/gm) v1.23.1 - Fully featured wrapper around GraphicsMagick's `gm` command line utility.
* [@squoosh/lib](https://www.npmjs.com/package/@squoosh/lib) v0.4.0 - Image libraries transpiled to WebAssembly, includes GPLv3 code.
* [@squoosh/cli](https://www.npmjs.com/package/@squoosh/cli) v0.7.2 - Command line wrapper around `@squoosh/lib`, avoids GPLv3 by spawning process.
* sharp v0.30.0 / libvips v8.12.2 - Caching within libvips disabled to ensure a fair comparison.

## The task

Decompress a 2725x2225 JPEG image,
resize to 720x588 using Lanczos 3 resampling (where available),
then compress to JPEG at a "quality" setting of 80.

## Test environment

* AWS EC2 eu-west-1 [c5ad.xlarge](https://aws.amazon.com/ec2/instance-types/c5/) (4x AMD EPYC 7R32)
* Ubuntu 21.10 (ami-0258eeb71ddf238b3)
* Node.js 16.13.2

## Results

| Module             | Input  | Output | Ops/sec | Speed-up |
| :----------------- | :----- | :----- | ------: | -------: |
| jimp               | buffer | buffer |    0.84 |      1.0 |
| squoosh-cli        | file   | file   |    1.08 |      1.3 |
| squoosh-lib        | buffer | buffer |    1.85 |      2.2 |
| mapnik             | buffer | buffer |    3.45 |      4.1 |
| gm                 | buffer | buffer |    8.60 |     10.2 |
| gm                 | file   | file   |    8.66 |     10.3 |
| imagemagick        | file   | file   |    8.79 |     10.5 |
| sharp              | stream | stream |   28.90 |     34.4 |
| sharp              | file   | file   |   30.08 |     35.8 |
| sharp              | buffer | buffer |   30.42 |     36.2 |

Greater libvips performance can be expected with caching enabled (default)
and using 8+ core machines, especially those with larger L1/L2 CPU caches.

The I/O limits of the relevant (de)compression library will generally determine maximum throughput.

## Running the benchmark test

Requires _ImageMagick_, _GraphicsMagick_ and _Mapnik_:

```sh
brew install imagemagick
brew install graphicsmagick
brew install mapnik
```

```sh
sudo apt-get install build-essential imagemagick libmagick++-dev graphicsmagick libmapnik-dev
```

```sh
sudo yum install ImageMagick-devel ImageMagick-c++-devel GraphicsMagick mapnik-devel
```

```sh
git clone https://github.com/lovell/sharp.git
cd sharp
npm install --build-from-source
cd test/bench
npm install
npm test
```
