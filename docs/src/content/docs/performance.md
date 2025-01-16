---
title: Performance
---

A test to benchmark the performance of this module relative to alternatives.

Greater libvips performance can be expected with caching enabled (default)
and using 8+ core machines, especially those with larger L1/L2 CPU caches.

The I/O limits of the relevant (de)compression library will generally determine maximum throughput.

## Contenders

* [jimp](https://www.npmjs.com/package/jimp) v0.22.10 - Image processing in pure JavaScript.
* [imagemagick](https://www.npmjs.com/package/imagemagick) v0.1.3 - Supports filesystem only and "*has been unmaintained for a long time*".
* [gm](https://www.npmjs.com/package/gm) v1.25.0 - Fully featured wrapper around GraphicsMagick's `gm` command line utility.
* [@squoosh/lib](https://www.npmjs.com/package/@squoosh/lib) v0.5.3 - Image libraries transpiled to WebAssembly, includes GPLv3 code, but "*Project no longer maintained*".
* [@squoosh/cli](https://www.npmjs.com/package/@squoosh/cli) v0.7.3 - Command line wrapper around `@squoosh/lib`, avoids GPLv3 by spawning process, but "*Project no longer maintained*".
* sharp v0.33.0 / libvips v8.15.0 - Caching within libvips disabled to ensure a fair comparison.

## Environment

### AMD64

* AWS EC2 us-east-2 [c7a.xlarge](https://aws.amazon.com/ec2/instance-types/c7a/) (4x AMD EPYC 9R14)
* Ubuntu 23.10 [13f233a16be2](https://hub.docker.com/layers/library/ubuntu/23.10/images/sha256-13f233a16be210b57907b98b0d927ceff7571df390701e14fe1f3901b2c4a4d7)
* Node.js 20.10.0

### ARM64

* AWS EC2 us-east-2 [c7g.xlarge](https://aws.amazon.com/ec2/instance-types/c7g/) (4x ARM Graviton3)
* Ubuntu 23.10 [7708743264cb](https://hub.docker.com/layers/library/ubuntu/23.10/images/sha256-7708743264cbb7f6cf7fc13e915faece45a6cdda455748bc55e58e8de3d27b63)
* Node.js 20.10.0

## Task: JPEG

Decompress a 2725x2225 JPEG image,
resize to 720x588 using Lanczos 3 resampling (where available),
then compress to JPEG at a "quality" setting of 80.

Note: jimp does not support Lanczos 3, bicubic resampling used instead.

#### Results: JPEG (AMD64)

| Module             | Input  | Output | Ops/sec | Speed-up |
| :----------------- | :----- | :----- | ------: | -------: |
| jimp               | buffer | buffer |    0.84 |      1.0 |
| squoosh-cli        | file   | file   |    1.54 |      1.8 |
| squoosh-lib        | buffer | buffer |    2.24 |      2.7 |
| imagemagick        | file   | file   |   11.75 |     14.0 |
| gm                 | buffer | buffer |   12.66 |     15.1 |
| gm                 | file   | file   |   12.72 |     15.1 |
| sharp              | stream | stream |   48.31 |     57.5 |
| sharp              | file   | file   |   51.42 |     61.2 |
| sharp              | buffer | buffer |   52.41 |     62.4 |

#### Results: JPEG (ARM64)

| Module             | Input  | Output | Ops/sec | Speed-up |
| :----------------- | :----- | :----- | ------: | -------: |
| jimp               | buffer | buffer |    0.88 |      1.0 |
| squoosh-cli        | file   | file   |    1.18 |      1.3 |
| squoosh-lib        | buffer | buffer |    1.99 |      2.3 |
| gm                 | buffer | buffer |    6.06 |      6.9 |
| gm                 | file   | file   |   10.81 |     12.3 |
| imagemagick        | file   | file   |   10.95 |     12.4 |
| sharp              | stream | stream |   33.15 |     37.7 |
| sharp              | file   | file   |   34.99 |     39.8 |
| sharp              | buffer | buffer |   36.05 |     41.0 |

## Task: PNG

Decompress a 2048x1536 RGBA PNG image,
premultiply the alpha channel,
resize to 720x540 using Lanczos 3 resampling (where available),
unpremultiply then compress as PNG with a "default" zlib compression level of 6
and without adaptive filtering.

Note: jimp does not support premultiply/unpremultiply.

### Results: PNG (AMD64)

| Module             | Input  | Output | Ops/sec | Speed-up |
| :----------------- | :----- | :----- | ------: | -------: |
| squoosh-cli        | file   | file   |    0.34 |      1.0 |
| squoosh-lib        | buffer | buffer |    0.51 |      1.5 |
| jimp               | buffer | buffer |    3.59 |     10.6 |
| gm                 | file   | file   |    8.54 |     25.1 |
| imagemagick        | file   | file   |    9.23 |     27.1 |
| sharp              | file   | file   |   25.43 |     74.8 |
| sharp              | buffer | buffer |   25.70 |     75.6 |

### Results: PNG (ARM64)

| Module             | Input  | Output | Ops/sec | Speed-up |
| :----------------- | :----- | :----- | ------: | -------: |
| squoosh-cli        | file   | file   |    0.33 |      1.0 |
| squoosh-lib        | buffer | buffer |    0.46 |      1.4 |
| jimp               | buffer | buffer |    3.51 |     10.6 |
| gm                 | file   | file   |    7.47 |     22.6 |
| imagemagick        | file   | file   |    8.06 |     24.4 |
| sharp              | file   | file   |   17.31 |     52.5 |
| sharp              | buffer | buffer |   17.66 |     53.5 |

## Running the benchmark test

Requires Docker.

```sh
git clone https://github.com/lovell/sharp.git
cd sharp/test/bench
./run-with-docker.sh
```
