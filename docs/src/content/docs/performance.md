---
title: Performance
---

## Parallelism and concurrency

Node.js uses a libuv-managed thread pool when processing asynchronous calls to native modules such as sharp.

The maximum number of images that sharp can process in parallel is controlled by libuv's
[`UV_THREADPOOL_SIZE`](https://nodejs.org/api/cli.html#uv_threadpool_sizesize)
environment variable, which defaults to 4.

When using more than 4 physical CPU cores, set this environment variable
before the Node.js process starts to increase the thread pool size.

```sh frame="none"
export UV_THREADPOOL_SIZE="$(lscpu -p | egrep -v "^#" | sort -u -t, -k 2,4 | wc -l)"
```

libvips uses a glib-managed thread pool to avoid the overhead of spawning new threads.

The default number of threads used to concurrently process each image is the same as the number of CPU cores,
except when using glibc-based Linux without jemalloc, where the default is `1` to help reduce memory fragmentation.

Use [`sharp.concurrency()`](/api-utility/#concurrency) to manage the number of threads per image.

The size of the shared thread pool will grow on demand and shrink when idle.
For control over this, set the `VIPS_MAX_THREADS` environment variable
to a value between 4 and 1024 to pre-allocate the thread pool at process start.

To reduce memory fragmentation when using the default Linux glibc memory allocator, set the
[`MALLOC_ARENA_MAX`](https://www.gnu.org/software/libc/manual/html_node/Memory-Allocation-Tunables.html)
environment variable before the Node.js process starts to reduce the number of memory pools.

```sh frame="none"
export MALLOC_ARENA_MAX="2"
```

## Benchmark

A test to benchmark the performance of this module relative to alternatives.

Greater libvips performance can be expected with caching enabled (default)
and using 8+ core machines, especially those with larger L1/L2 CPU caches.

The I/O limits of the relevant (de)compression library will generally determine maximum throughput.

### Contenders

- [jimp](https://www.npmjs.com/package/jimp) v1.6.0 - Image processing in pure JavaScript.
- [imagemagick](https://www.npmjs.com/package/imagemagick) v0.1.3 - Supports filesystem only and "_has been unmaintained for a long time_".
- [gm](https://www.npmjs.com/package/gm) v1.25.1 - Fully featured wrapper around GraphicsMagick's `gm` command line utility, but "_has been sunset_".
- sharp v0.34.3 / libvips v8.17.0 - Caching within libvips disabled to ensure a fair comparison.

### Environment

#### AMD64

- AWS EC2 us-west-2 [c7a.xlarge](https://aws.amazon.com/ec2/instance-types/c7a/) (4x AMD EPYC 9R14)
- Ubuntu 25.04
- Node.js 24.3.0

#### ARM64

- AWS EC2 us-west-2 [c8g.xlarge](https://aws.amazon.com/ec2/instance-types/c8g/) (4x ARM Graviton4)
- Ubuntu 25.04
- Node.js 24.3.0

### Task: JPEG

Decompress a 2725x2225 JPEG image,
resize to 720x588 using Lanczos 3 resampling (where available),
then compress to JPEG at a "quality" setting of 80.

Note: jimp does not support Lanczos 3, bicubic resampling used instead.

#### Results: JPEG (AMD64)

| Package     | I/O    | Ops/sec | Speed-up |
| :---------- | :----- | ------: | -------: |
| jimp        | buffer |    2.40 |      1.0 |
| jimp        | file   |    2.60 |      1.1 |
| imagemagick | file   |    9.70 |      4.0 |
| gm          | buffer |   11.60 |      4.8 |
| gm          | file   |   11.72 |      4.9 |
| sharp       | stream |   59.40 |     24.8 |
| sharp       | file   |   62.67 |     26.1 |
| sharp       | buffer |   64.42 |     26.8 |

#### Results: JPEG (ARM64)

| Package     | I/O    | Ops/sec | Speed-up |
| :---------- | :----- | ------: | -------: |
| jimp        | buffer |    2.24 |      1.0 |
| jimp        | file   |    2.47 |      1.1 |
| imagemagick | file   |   10.42 |      4.7 |
| gm          | buffer |   12.80 |      5.7 |
| gm          | file   |   12.88 |      5.7 |
| sharp       | stream |   45.58 |     20.3 |
| sharp       | file   |   47.99 |     21.4 |
| sharp       | buffer |   49.20 |     22.0 |

### Task: PNG

Decompress a 2048x1536 RGBA PNG image,
premultiply the alpha channel,
resize to 720x540 using Lanczos 3 resampling (where available),
unpremultiply then compress as PNG with a "default" zlib compression level of 6
and without adaptive filtering.

Note: jimp does not support premultiply/unpremultiply.

#### Results: PNG (AMD64)

| Package     | I/O    | Ops/sec | Speed-up |
| :---------- | :----- | ------: | -------: |
| imagemagick | file   |    6.06 |      1.0 |
| gm          | file   |    8.44 |      1.4 |
| jimp        | buffer |   10.98 |      1.8 |
| sharp       | file   |   28.26 |      4.7 |
| sharp       | buffer |   28.70 |      4.7 |

#### Results: PNG (ARM64)

| Package     | I/O    | Ops/sec | Speed-up |
| :---------- | :----- | ------: | -------: |
| imagemagick | file   |    7.09 |      1.0 |
| gm          | file   |    8.93 |      1.3 |
| jimp        | buffer |   10.28 |      1.5 |
| sharp       | file   |   23.81 |      3.4 |
| sharp       | buffer |   24.19 |      3.4 |

## Running the benchmark test

Requires Docker.

```sh frame="none"
git clone https://github.com/lovell/sharp.git
cd sharp/test/bench
./run-with-docker.sh
```
