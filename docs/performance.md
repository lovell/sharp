# Performance

A test to benchmark the performance of this module relative to alternatives.

Greater libvips performance can be expected with caching enabled (default)
and using 8+ core machines, especially those with larger L1/L2 CPU caches.

The I/O limits of the relevant (de)compression library will generally determine maximum throughput.

## Contenders

* [jimp](https://www.npmjs.com/package/jimp) v0.22.7 - Image processing in pure JavaScript.
* [imagemagick](https://www.npmjs.com/package/imagemagick) v0.1.3 - Supports filesystem only and "*has been unmaintained for a long time*".
* [gm](https://www.npmjs.com/package/gm) v1.25.0 - Fully featured wrapper around GraphicsMagick's `gm` command line utility.
* [@squoosh/lib](https://www.npmjs.com/package/@squoosh/lib) v0.4.0 - Image libraries transpiled to WebAssembly, includes GPLv3 code, but "*Project no longer maintained*".
* [@squoosh/cli](https://www.npmjs.com/package/@squoosh/cli) v0.7.3 - Command line wrapper around `@squoosh/lib`, avoids GPLv3 by spawning process, but "*Project no longer maintained*".
* sharp v0.32.0 / libvips v8.14.2 - Caching within libvips disabled to ensure a fair comparison.

## Environment

### AMD64

* AWS EC2 us-east-2 [c6a.xlarge](https://aws.amazon.com/ec2/instance-types/c6a/) (4x AMD EPYC 7R13)
* Ubuntu 22.04 20230303 (ami-0122295b0eb922138)
* Node.js 16.19.1

### ARM64

* AWS EC2 us-east-2 [c7g.xlarge](https://aws.amazon.com/ec2/instance-types/c7g/) (4x ARM Graviton3)
* Ubuntu 22.04 20230303 (ami-0af198159897e7a29)
* Node.js 16.19.1

## Task: JPEG

Decompress a 2725x2225 JPEG image,
resize to 720x588 using Lanczos 3 resampling (where available),
then compress to JPEG at a "quality" setting of 80.

Note: jimp does not support Lanczos 3, bicubic resampling used instead.

#### Results: JPEG (AMD64)

| Module             | Input  | Output | Ops/sec | Speed-up |
| :----------------- | :----- | :----- | ------: | -------: |
| jimp               | buffer | buffer |    0.84 |      1.0 |
| squoosh-cli        | file   | file   |    1.07 |      1.3 |
| squoosh-lib        | buffer | buffer |    1.82 |      2.2 |
| gm                 | buffer | buffer |    8.41 |     10.0 |
| gm                 | file   | file   |    8.45 |     10.0 |
| imagemagick        | file   | file   |    8.77 |     10.4 |
| sharp              | stream | stream |   36.36 |     43.3 |
| sharp              | file   | file   |   38.67 |     46.0 |
| sharp              | buffer | buffer |   39.44 |     47.0 |

#### Results: JPEG (ARM64)

| Module             | Input  | Output | Ops/sec | Speed-up |
| :----------------- | :----- | :----- | ------: | -------: |
| jimp               | buffer | buffer |    1.02 |      1.0 |
| squoosh-cli        | file   | file   |    1.11 |      1.1 |
| squoosh-lib        | buffer | buffer |    2.08 |      2.0 |
| gm                 | buffer | buffer |    8.80 |      8.6 |
| gm                 | file   | file   |   10.05 |      9.9 |
| imagemagick        | file   | file   |   10.28 |     10.1 |
| sharp              | stream | stream |   26.87 |     26.3 |
| sharp              | file   | file   |   27.88 |     27.3 |
| sharp              | buffer | buffer |   28.40 |     27.8 |

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
| squoosh-cli        | file   | file   |    0.40 |      1.0 |
| squoosh-lib        | buffer | buffer |    0.47 |      1.2 |
| gm                 | file   | file   |    6.47 |     16.2 |
| jimp               | buffer | buffer |    6.60 |     16.5 |
| imagemagick        | file   | file   |    7.08 |     17.7 |
| sharp              | file   | file   |   17.80 |     44.5 |
| sharp              | buffer | buffer |   18.02 |     45.0 |

### Results: PNG (ARM64)

| Module             | Input  | Output | Ops/sec | Speed-up |
| :----------------- | :----- | :----- | ------: | -------: |
| squoosh-cli        | file   | file   |    0.40 |      1.0 |
| squoosh-lib        | buffer | buffer |    0.48 |      1.2 |
| gm                 | file   | file   |    7.20 |     18.0 |
| jimp               | buffer | buffer |    7.62 |     19.1 |
| imagemagick        | file   | file   |    7.96 |     19.9 |
| sharp              | file   | file   |   12.97 |     32.4 |
| sharp              | buffer | buffer |   13.12 |     32.8 |

## Running the benchmark test

Requires Docker.

```sh
git clone https://github.com/lovell/sharp.git
cd sharp/test/bench
./run-with-docker.sh
```
