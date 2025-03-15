---
title: Performance
---

A test to benchmark the performance of this module relative to alternatives.

Greater libvips performance can be expected with caching enabled (default)
and using 8+ core machines, especially those with larger L1/L2 CPU caches.

The I/O limits of the relevant (de)compression library will generally determine maximum throughput.

## Contenders

* [jimp](https://www.npmjs.com/package/jimp) v1.6.0 - Image processing in pure JavaScript.
* [imagemagick](https://www.npmjs.com/package/imagemagick) v0.1.3 - Supports filesystem only and "*has been unmaintained for a long time*".
* [gm](https://www.npmjs.com/package/gm) v1.25.1 - Fully featured wrapper around GraphicsMagick's `gm` command line utility, but "*has been sunset*".
* sharp v0.34.0 / libvips v8.16.1 - Caching within libvips disabled to ensure a fair comparison.

## Environment

### AMD64

* AWS EC2 us-west-2 [c7a.xlarge](https://aws.amazon.com/ec2/instance-types/c7a/) (4x AMD EPYC 9R14)
* Ubuntu 24.10 [fad5ba7223f8](https://hub.docker.com/layers/library/ubuntu/24.10/images/sha256-fad5ba7223f8d87179dfa23211d31845d47e07a474ac31ad5258afb606523c0d)
* Node.js 22.14.0

### ARM64

* AWS EC2 us-west-2 [c8g.xlarge](https://aws.amazon.com/ec2/instance-types/c8g/) (4x ARM Graviton4)
* Ubuntu 24.10 [133f2e05cb69](https://hub.docker.com/layers/library/ubuntu/24.10/images/sha256-133f2e05cb6958c3ce7ec870fd5a864558ba780fb7062315b51a23670bff7e76)
* Node.js 22.14.0

## Task: JPEG

Decompress a 2725x2225 JPEG image,
resize to 720x588 using Lanczos 3 resampling (where available),
then compress to JPEG at a "quality" setting of 80.

Note: jimp does not support Lanczos 3, bicubic resampling used instead.

#### Results: JPEG (AMD64)

| Module             | Input  | Output | Ops/sec | Speed-up |
| :----------------- | :----- | :----- | ------: | -------: |
| jimp               | buffer | buffer |    2.35 |      1.0 |
| imagemagick        | file   | file   |   10.51 |      4.5 |
| gm                 | buffer | buffer |   11.67 |      5.0 |
| gm                 | file   | file   |   11.75 |      5.1 |
| sharp              | stream | stream |   60.72 |     25.8 |
| sharp              | file   | file   |   62.37 |     26.5 |
| sharp              | buffer | buffer |   65.15 |     27.7 |

#### Results: JPEG (ARM64)

| Module             | Input  | Output | Ops/sec | Speed-up |
| :----------------- | :----- | :----- | ------: | -------: |
| jimp               | buffer | buffer |    2.13 |      1.0 |
| imagemagick        | file   | file   |   12.95 |      6.1 |
| gm                 | buffer | buffer |   13.53 |      6.4 |
| gm                 | file   | file   |   13.52 |      6.4 |
| sharp              | stream | stream |   46.58 |     21.9 |
| sharp              | file   | file   |   48.42 |     22.7 |
| sharp              | buffer | buffer |   50.16 |     23.6 |

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
| gm                 | file   | file   |    8.66 |      1.0 |
| imagemagick        | file   | file   |    8.79 |      1.0 |
| jimp               | buffer | buffer |   11.26 |      1.3 |
| sharp              | file   | file   |   27.93 |      3.2 |
| sharp              | buffer | buffer |   28.69 |      3.3 |

### Results: PNG (ARM64)

| Module             | Input  | Output | Ops/sec | Speed-up |
| :----------------- | :----- | :----- | ------: | -------: |
| gm                 | file   | file   |    9.65 |      1.0 |
| imagemagick        | file   | file   |    9.72 |      1.0 |
| jimp               | buffer | buffer |   10.68 |      1.1 |
| sharp              | file   | file   |   23.90 |      2.5 |
| sharp              | buffer | buffer |   24.48 |      2.5 |

## Running the benchmark test

Requires Docker.

```sh
git clone https://github.com/lovell/sharp.git
cd sharp/test/bench
./run-with-docker.sh
```
