# Performance

### Test environment

* AWS EC2 [c4.xlarge](http://aws.amazon.com/ec2/instance-types/#c4)
* Ubuntu 15.04
* Node.js 0.12.7
* libvips 8.0.2
* liborc 0.4.22

### The contenders

* [lwip](https://www.npmjs.com/package/lwip) 0.0.7 - Wrapper around CImg, compiles dependencies from source
* [imagemagick-native](https://www.npmjs.com/package/imagemagick-native) git@45d4e2e - Wrapper around libmagick++, supports Buffers only.
* [imagemagick](https://www.npmjs.com/package/imagemagick) 0.1.3 - Supports filesystem only and "*has been unmaintained for a long time*".
* [gm](https://www.npmjs.com/package/gm) 1.18.1 - Fully featured wrapper around GraphicsMagick's `convert` command line utility.
* sharp 0.11.0 - Caching within libvips disabled to ensure a fair comparison.

### The task

Decompress a 2725x2225 JPEG image, resize to 720x480 using bilinear interpolation, then compress to JPEG.

### Results

| Module             | Input  | Output | Ops/sec | Speed-up |
| :----------------- | :----- | :----- | ------: | -------: |
| lwip               | file   | file   |    1.75 |        1 |
| lwip               | buffer | buffer |    2.21 |      1.3 |
| imagemagick-native | buffer | buffer |    7.13 |      4.1 |
| gm                 | buffer | buffer |    7.27 |      4.2 |
| gm                 | file   | file   |    7.33 |      4.2 |
| imagemagick        | file   | file   |   10.04 |      5.7 |
| sharp              | stream | stream |   23.12 |     13.2 |
| sharp              | file   | file   |   24.43 |     14.0 |
| sharp              | file   | buffer |   24.55 |     14.0 |
| sharp              | buffer | file   |   24.86 |     14.2 |
| sharp              | buffer | buffer |   24.92 |     14.2 |

Greater performance can be expected with caching enabled (default) and using 8+ core machines.

The I/O limits of the relevant (de)compression library will generally determine maximum throughput.

### Benchmark test prerequisites

Requires both _ImageMagick_ and _GraphicsMagick_:

```sh
brew install imagemagick
brew install graphicsmagick
```

```sh
sudo apt-get install imagemagick graphicsmagick libmagick++-dev
```

### Running the benchmark test

```sh
git clone https://github.com/lovell/sharp.git
cd sharp/test/bench
npm install
npm test
```
