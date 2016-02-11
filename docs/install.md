# Installation

```sh
npm install sharp
```

### Prerequisites

* C++11 compatible compiler such as gcc 4.6+ (Node v4+ requires gcc 4.8+), clang 3.0+ or MSVC 2013
* [node-gyp](https://github.com/TooTallNate/node-gyp#installation)

### Linux

[![Ubuntu 14.04 Build Status](https://travis-ci.org/lovell/sharp.png?branch=master)](https://travis-ci.org/lovell/sharp)
[![Linux Build Status](https://circleci.com/gh/lovell/sharp.svg?style=svg&circle-token=6cb6d1d287a51af83722b19ed8885377fbc85e5c)](https://circleci.com/gh/lovell/sharp)

libvips and its dependencies are fetched and stored within `node_modules/sharp` during `npm install`.
This involves an automated HTTPS download of approximately 6MB.

Most recent Linux-based operating systems with glibc running on x64 and ARMv6+ CPUs should "just work", e.g.:

* Debian 7, 8
* Ubuntu 12.04, 14.04, 14.10, 15.04, 15.10
* Centos 7
* Fedora 21, 22, 23
* openSUSE 13.2
* Archlinux 2015.06.01
* Raspbian Jessie

Preference will be given to an existing globally-installed (via `pkg-config`)
version of libvips that meets the minimum version requirement.
This allows the use of newer versions of libvips with older versions of sharp.

For older Linux-based operating systems and 32-bit Intel CPUs,
a system-wide installation of the most suitable version of
libvips and its dependencies can be achieved by running
the following command as a user with `sudo` access
(requires `curl` and `pkg-config`):

```sh
curl -s https://raw.githubusercontent.com/lovell/sharp/master/preinstall.sh | sudo bash -
```

For Linux-based operating systems such as Alpine that use musl libc,
the smaller stack size means libvips' cache should be disabled
via `sharp.cache(false)` to avoid a stack overflow.

### Mac OS

[![OS X 10.9.5 Build Status](https://travis-ci.org/lovell/sharp-osx-ci.png?branch=master)](https://travis-ci.org/lovell/sharp-osx-ci)

libvips must be installed before `npm install` is run.
This can be achieved via homebrew:

```sh
brew install homebrew/science/vips
```

For GIF input and WebP output suppport use:

```sh
brew install homebrew/science/vips --with-imagemagick --with-webp
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

[![Windows x64 Build Status](https://ci.appveyor.com/api/projects/status/pgtul704nkhhg6sg)](https://ci.appveyor.com/project/lovell/sharp)

libvips and its dependencies are fetched and stored within `node_modules\sharp` during `npm install`.
This involves an automated HTTPS download of approximately 9MB.

Only 64-bit (x64) `node.exe` is supported.
The WebP format is currently unavailable on Windows.

### FreeBSD

libvips must be installed before `npm install` is run.
This can be achieved via [FreshPorts](https://www.freshports.org/graphics/vips/):

```sh
cd /usr/ports/graphics/vips/ && make install clean
```

### Heroku

[Alessandro Tagliapietra](https://github.com/alex88) maintains an
[Heroku buildpack for libvips](https://github.com/alex88/heroku-buildpack-vips)
and its dependencies.

### Docker

[Marc Bachmann](https://github.com/marcbachmann) maintains an
[Ubuntu-based Dockerfile for libvips](https://github.com/marcbachmann/dockerfile-libvips).

```sh
docker pull marcbachmann/libvips
```

[Will Jordan](https://github.com/wjordan) maintains an
[Alpine-based Dockerfile for libvips](https://github.com/wjordan/dockerfile-libvips).

```sh
docker pull wjordan/libvips
```

### Build tools

* [gulp-responsive](https://www.npmjs.com/package/gulp-responsive)
* [grunt-sharp](https://www.npmjs.com/package/grunt-sharp)
