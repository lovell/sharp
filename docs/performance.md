# Performance

A test to benchmark the performance of this module relative to alternatives.

Greater libvips performance can be expected with caching enabled (default)
and using 8+ core machines, especially those with larger L1/L2 CPU caches.

The I/O limits of the relevant (de)compression library will generally determine maximum throughput.

## The contenders

* [jimp](https://www.npmjs.com/package/jimp) v0.16.2 - Image processing in pure JavaScript. Provides bicubic interpolation.
* [imagemagick](https://www.npmjs.com/package/imagemagick) v0.1.3 - Supports filesystem only and "*has been unmaintained for a long time*".
* [gm](https://www.npmjs.com/package/gm) v1.25.0 - Fully featured wrapper around GraphicsMagick's `gm` command line utility.
* [@squoosh/lib](https://www.npmjs.com/package/@squoosh/lib) v0.4.0 - Image libraries transpiled to WebAssembly, includes GPLv3 code.
* [@squoosh/cli](https://www.npmjs.com/package/@squoosh/cli) v0.7.2 - Command line wrapper around `@squoosh/lib`, avoids GPLv3 by spawning process.
* sharp v0.31.3 / libvips v8.13.3 - Caching within libvips disabled to ensure a fair comparison.

## The task

Decompress a 2725x2225 JPEG image,
resize to 720x588 using Lanczos 3 resampling (where available),
then compress to JPEG at a "quality" setting of 80.

## Results

### AMD64

* AWS EC2 eu-west-1 [c6a.xlarge](https://aws.amazon.com/ec2/instance-types/c6a/) (4x AMD EPYC 7R13)
* Ubuntu 22.04 (ami-026e72e4e468afa7b)
* Node.js 16.19.0

| Module             | Input  | Output | Ops/sec | Speed-up |
| :----------------- | :----- | :----- | ------: | -------: |
| jimp               | buffer | buffer |    0.82 |      1.0 |
| squoosh-cli        | file   | file   |    1.05 |      1.3 |
| squoosh-lib        | buffer | buffer |    1.19 |      1.5 |
| gm                 | buffer | buffer |    8.47 |     10.3 |
| gm                 | file   | file   |    8.58 |     10.5 |
| imagemagick        | file   | file   |    9.23 |     11.3 |
| sharp              | stream | stream |   33.23 |     40.5 |
| sharp              | file   | file   |   35.22 |     43.0 |
| sharp              | buffer | buffer |   35.70 |     43.5 |

### ARM64

* AWS EC2 eu-west-1 [c7g.xlarge](https://aws.amazon.com/ec2/instance-types/c7g/) (4x ARM Graviton3)
* Ubuntu 22.04 (ami-02142ceceb3933ff5)
* Node.js 16.19.0

| Module             | Input  | Output | Ops/sec | Speed-up |
| :----------------- | :----- | :----- | ------: | -------: |
| jimp               | buffer | buffer |    0.84 |      1.0 |
| squoosh-cli        | file   | file   |    1.12 |      1.3 |
| squoosh-lib        | buffer | buffer |    2.11 |      2.5 |
| gm                 | buffer | buffer |   10.39 |     12.4 |
| gm                 | file   | file   |   10.40 |     12.4 |
| imagemagick        | file   | file   |   10.73 |     12.8 |
| sharp              | stream | stream |   33.63 |     40.0 |
| sharp              | file   | file   |   34.91 |     41.6 |
| sharp              | buffer | buffer |   35.72 |     42.5 |

## Running the benchmark test

Requires Docker.

```sh
git clone https://github.com/lovell/sharp.git
cd sharp/test/bench
./run-with-docker.sh
```
