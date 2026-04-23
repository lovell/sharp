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

libvips uses a shared thread pool to avoid the overhead of spawning new threads.
The size of this thread pool will grow on demand and shrink when idle.

The default number of threads used to concurrently process each image is the same as the number of CPU cores,
except when using glibc-based Linux without jemalloc, where the default is `1` to help reduce memory fragmentation.

Use [`sharp.concurrency()`](/api-utility/#concurrency) to manage the number of threads per image.

To reduce memory fragmentation when using the default Linux glibc memory allocator, set the
[`MALLOC_ARENA_MAX`](https://sourceware.org/glibc/manual/latest/html_node/Memory-Allocation-Tunables.html)
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

- [jimp](https://www.npmjs.com/package/jimp) v1.6.1 - Image processing in pure JavaScript.
- [imagemagick](https://www.npmjs.com/package/imagemagick) v0.1.3 - Supports filesystem only and "_has been unmaintained for a long time_".
- [gm](https://www.npmjs.com/package/gm) v1.25.1 - Fully featured wrapper around GraphicsMagick's `gm` command line utility, but "_has been sunset_".
- sharp v0.35.0 / libvips v8.18.2 - Caching within libvips disabled to ensure a fair comparison.

### Environment

#### AMD64

- AWS EC2 us-west-2 [c8a.xlarge](https://aws.amazon.com/ec2/instance-types/c8a/) (4x AMD EPYC 9R45)
- Ubuntu 25.10
- Node.js 24.15.0

#### ARM64

- AWS EC2 us-west-2 [c8g.xlarge](https://aws.amazon.com/ec2/instance-types/c8g/) (4x ARM Graviton4)
- Ubuntu 25.10
- Node.js 24.15.0

### Task: JPEG

Decompress a 2725x2225 JPEG image,
resize to 720x588 using Lanczos 3 resampling (where available),
then compress to JPEG at a "quality" setting of 80.

Note: jimp does not support Lanczos 3, bicubic resampling used instead.

#### Results: JPEG (AMD64)

| Package     | I/O    | Ops/sec | Speed-up |
| :---------- | :----- | ------: | -------: |
| jimp        | buffer |    3.44 |      1.0 |
| jimp        | file   |    3.65 |      1.1 |
| imagemagick | file   |   16.23 |      4.7 |
| gm          | buffer |   20.92 |      6.1 |
| gm          | file   |   21.04 |      6.1 |
| sharp       | stream |   82.87 |     24.1 |
| sharp       | file   |   88.21 |     25.6 |
| sharp       | buffer |   89.63 |     26.1 |

#### Results: JPEG (ARM64)

| Package     | I/O    | Ops/sec | Speed-up |
| :---------- | :----- | ------: | -------: |
| jimp        | buffer |    2.20 |      1.0 |
| jimp        | file   |    2.45 |      1.1 |
| imagemagick | file   |    5.85 |      2.7 |
| gm          | file   |   13.72 |      6.2 |
| gm          | buffer |   13.82 |      6.3 |
| sharp       | stream |   49.82 |     22.6 |
| sharp       | file   |   52.42 |     23.8 |
| sharp       | buffer |   53.83 |     24.5 |

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
| imagemagick | file   |   10.37 |      1.0 |
| gm          | file   |   13.35 |      1.3 |
| jimp        | buffer |   17.04 |      1.6 |
| jimp        | file   |   17.15 |      1.7 |
| sharp       | file   |   47.17 |      4.5 |
| sharp       | buffer |   47.74 |      4.6 |

#### Results: PNG (ARM64)

| Package     | I/O    | Ops/sec | Speed-up |
| :---------- | :----- | ------: | -------: |
| imagemagick | file   |    4.39 |      1.0 |
| gm          | file   |    9.45 |      2.2 |
| jimp        | buffer |   10.36 |      2.4 |
| jimp        | file   |   10.52 |      2.4 |
| sharp       | file   |   28.04 |      6.4 |
| sharp       | buffer |   28.57 |      6.5 |

## Running the benchmark test

Requires Docker.

```sh frame="none"
git clone https://github.com/lovell/sharp.git
cd sharp/test/bench
./run-with-docker.sh
```
