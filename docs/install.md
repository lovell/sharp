# Installation

```sh
npm install sharp
```

### Prerequisites

* Node.js v0.10+ or io.js
* [libvips](https://github.com/jcupitt/libvips) v7.40.0+ (7.42.0+ recommended)
* C++11 compatible compiler such as gcc 4.6+, clang 3.0+ or MSVC 2013 (io.js v3+ requires gcc 4.8+)

### Linux

[![Ubuntu 12.04 Build Status](https://travis-ci.org/lovell/sharp.png?branch=master)](https://travis-ci.org/lovell/sharp)
[![Centos 6.5 Build Status](https://snap-ci.com/lovell/sharp/branch/master/build_image)](https://snap-ci.com/lovell/sharp/branch/master)

For a system-wide installation of the most suitable version of
libvips and its dependencies on the following Operating Systems:

* Debian 7, 8
* Ubuntu 12.04, 14.04, 14.10, 15.04
* Mint 13, 17
* RHEL/Centos/Scientific 6, 7
* Fedora 21, 22
* Amazon Linux 2014.09, 2015.03
* OpenSuse 13

run the following as a user with `sudo` access:

```sh
curl -s https://raw.githubusercontent.com/lovell/sharp/master/preinstall.sh | sudo bash -
```

or run the following as `root`:

```sh
curl -s https://raw.githubusercontent.com/lovell/sharp/master/preinstall.sh | bash -
```

The [preinstall.sh](https://github.com/lovell/sharp/blob/master/preinstall.sh) script requires `curl` and `pkg-config`.

Add `--with-openslide` to enable OpenSlide support:

```sh
curl -s https://raw.githubusercontent.com/lovell/sharp/master/preinstall.sh | sudo bash -s -- --with-openslide
```

#### Ubuntu LTS

libvips v7.40.6 is available via a PPA.

##### 12.04

```sh
sudo add-apt-repository -y ppa:lovell/precise-backport-vips
sudo apt-get update
sudo apt-get install -y libvips-dev libgsf-1-dev
```

##### 14.04

```sh
sudo add-apt-repository -y ppa:lovell/trusty-backport-vips
sudo apt-get update
sudo apt-get install -y libvips-dev libgsf-1-dev
```

### Mac OS

[![OS X 10.9.5 Build Status](https://travis-ci.org/lovell/sharp-osx-ci.png?branch=master)](https://travis-ci.org/lovell/sharp-osx-ci)

Install libvips via homebrew:

```sh
brew install homebrew/science/vips --with-webp --with-graphicsmagick
```

A missing or incorrectly configured _Xcode Command Line Tools_ installation
[can lead](https://github.com/lovell/sharp/issues/80) to a
`library not found for -ljpeg` error.
If so, please try: `xcode-select --install`.

The _gettext_ dependency of _libvips_
[can lead](https://github.com/lovell/sharp/issues/9)
to a `library not found for -lintl` error.
If so, please try `brew link gettext --force`.

### Windows

[![Windows Server 2012 Build Status](https://ci.appveyor.com/api/projects/status/pgtul704nkhhg6sg)](https://ci.appveyor.com/project/lovell/sharp)

Requires x86 32-bit Node.js or io.js (use `iojs.exe` rather than `node.exe`).

The WebP format is currently unsupported.

1. Ensure the [node-gyp prerequisites](https://github.com/TooTallNate/node-gyp#installation) are met.
2. [Download](http://www.vips.ecs.soton.ac.uk/supported/current/win32/) and unzip `vips-dev.x.y.z.zip`.
3. Set the `VIPS_HOME` environment variable to the full path of the `vips-dev-x.y.z` directory.
4. Add `vips-dev-x.y.z\bin` to `PATH`.

Versions of MSVC more recent than 2013 may require the use of `npm install --arch=ia32 --msvs_version=2013`.

### Heroku

[Alessandro Tagliapietra](https://github.com/alex88) maintains an
[Heroku buildpack for libvips](https://github.com/alex88/heroku-buildpack-vips)
and its dependencies.

### Docker

[Marc Bachmann](https://github.com/marcbachmann) maintains a
[Dockerfile for libvips](https://github.com/marcbachmann/dockerfile-libvips).

```sh
docker pull marcbachmann/libvips
```

### Build tools

* [gulp-responsive](https://www.npmjs.com/package/gulp-responsive)
* [gulp-sharp](https://www.npmjs.com/package/gulp-sharp)
* [grunt-sharp](https://www.npmjs.com/package/grunt-sharp)
