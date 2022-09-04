# Performance

A test to benchmark the performance of this module relative to alternatives.

## The contenders

* [jimp](https://www.npmjs.com/package/jimp) v0.16.1 - Image processing in pure JavaScript. Provides bicubic interpolation.
* [mapnik](https://www.npmjs.org/package/mapnik) v4.5.9 - Whilst primarily a map renderer, Mapnik contains bitmap image utilities.
* [imagemagick](https://www.npmjs.com/package/imagemagick) v0.1.3 - Supports filesystem only and "*has been unmaintained for a long time*".
* [gm](https://www.npmjs.com/package/gm) v1.23.1 - Fully featured wrapper around GraphicsMagick's `gm` command line utility.
* [@squoosh/lib](https://www.npmjs.com/package/@squoosh/lib) v0.4.0 - Image libraries transpiled to WebAssembly, includes GPLv3 code.
* [@squoosh/cli](https://www.npmjs.com/package/@squoosh/cli) v0.7.2 - Command line wrapper around `@squoosh/lib`, avoids GPLv3 by spawning process.
* sharp v0.31.0 / libvips v8.13.1 - Caching within libvips disabled to ensure a fair comparison.

## The task

Decompress a 2725x2225 JPEG image,
resize to 720x588 using Lanczos 3 resampling (where available),
then compress to JPEG at a "quality" setting of 80.

## Test environment

* AWS EC2 eu-west-1 [c6a.xlarge](https://aws.amazon.com/ec2/instance-types/c6a/) (4x AMD EPYC 7R13)
* Ubuntu 22.04 (ami-051f7c00cb18501ee)
* Node.js 16.17.0

## Results

| Module             | Input  | Output | Ops/sec | Speed-up |
| :----------------- | :----- | :----- | ------: | -------: |
| jimp               | buffer | buffer |    0.96 |      1.0 |
| squoosh-cli        | file   | file   |    1.10 |      1.1 |
| squoosh-lib        | buffer | buffer |    1.87 |      1.9 |
| mapnik             | buffer | buffer |    3.48 |      3.6 |
| gm                 | buffer | buffer |    8.53 |      8.9 |
| gm                 | file   | file   |    8.60 |      9.0 |
| imagemagick        | file   | file   |    9.30 |      9.7 |
| sharp              | stream | stream |   32.86 |     34.2 |
| sharp              | file   | file   |   34.82 |     36.3 |
| sharp              | buffer | buffer |   35.41 |     36.9 |

Greater libvips performance can be expected with caching enabled (default)
and using 8+ core machines, especially those with larger L1/L2 CPU caches.

The I/O limits of the relevant (de)compression library will generally determine maximum throughput.

## Running the benchmark test

Requires Docker.

```sh
git clone https://github.com/lovell/sharp.git
cd sharp/test/bench
./run-with-docker.sh
```
