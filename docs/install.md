# Installation

```sh
npm install sharp
```

```sh
yarn add sharp
```

## Prerequisites

* Node v4.5.0+

### Building from source

Pre-compiled binaries for sharp are provided for use with
Node versions 4, 6, 8 and 10 on
64-bit Windows, OS X and Linux platforms.

Sharp will be built from source at install time when:

* a globally-installed libvips is detected,
* pre-compiled binaries do not exist for the current platform and Node version, or
* when the `npm install --build-from-source` flag is used.

Building from source requires:

* C++11 compatible compiler such as gcc 4.8+, clang 3.0+ or MSVC 2013+
* [node-gyp](https://github.com/TooTallNate/node-gyp#installation) and its dependencies (includes Python)

## libvips

### Linux

[![Ubuntu 16.04 Build Status](https://travis-ci.org/lovell/sharp.png?branch=master)](https://travis-ci.org/lovell/sharp)

libvips and its dependencies are fetched and stored within `node_modules/sharp/vendor` during `npm install`.
This involves an automated HTTPS download of approximately 7MB.

Most recent Linux-based operating systems with glibc running on x64 and ARMv6+ CPUs should "just work", e.g.:

* Debian 7+
* Ubuntu 14.04+
* Centos 7+
* Fedora
* openSUSE 13.2+
* Archlinux
* Raspbian Jessie
* Amazon Linux
* Solus

To use a globally-installed version of libvips instead of the provided binaries,
make sure it is at least the version listed under `config.libvips` in the `package.json` file
and that it can be located using `pkg-config --modversion vips-cpp`.

If you are using non-standard paths (anything other than `/usr` or `/usr/local`),
you might need to set `PKG_CONFIG_PATH` during `npm install`
and `LD_LIBRARY_PATH` at runtime.

This allows the use of newer versions of libvips with older versions of sharp.

For 32-bit Intel CPUs and older Linux-based operating systems such as Centos 6,
it is recommended to install a system-wide installation of libvips from source:

https://jcupitt.github.io/libvips/install.html#building-libvips-from-a-source-tarball

#### Alpine Linux

libvips is available in the
[testing repository](https://pkgs.alpinelinux.org/packages?name=vips-dev):

```sh
apk add vips-dev fftw-dev --update-cache --repository https://dl-3.alpinelinux.org/alpine/edge/testing/
```

The smaller stack size of musl libc means
libvips may need to be used without a cache
via `sharp.cache(false)` to avoid a stack overflow.

### Mac OS

[![OS X 10.12 Build Status](https://travis-ci.org/lovell/sharp.png?branch=master)](https://travis-ci.org/lovell/sharp)

libvips and its dependencies are fetched and stored within `node_modules/sharp/vendor` during `npm install`.
This involves an automated HTTPS download of approximately 7MB.

To use your own version of libvips instead of the provided binaries, make sure it is
at least the version listed under `config.libvips` in the `package.json` file and
that it can be located using `pkg-config --modversion vips-cpp`.

### Windows x64

[![Windows x64 Build Status](https://ci.appveyor.com/api/projects/status/pgtul704nkhhg6sg)](https://ci.appveyor.com/project/lovell/sharp)

libvips and its dependencies are fetched and stored within `node_modules\sharp\vendor` during `npm install`.
This involves an automated HTTPS download of approximately 12MB.

Only 64-bit (x64) `node.exe` is supported.

### FreeBSD

libvips must be installed before `npm install` is run.

This can be achieved via package or ports:

```sh
pkg install -y pkgconf vips
```

```sh
cd /usr/ports/graphics/vips/ && make install clean
```

FreeBSD's gcc v4 and v5 need `CXXFLAGS=-D_GLIBCXX_USE_C99` set for C++11 support due to
https://bugs.freebsd.org/bugzilla/show_bug.cgi?id=193528

### Heroku

libvips and its dependencies are fetched and stored within `node_modules\sharp\vendor` during `npm install`.
This involves an automated HTTPS download of approximately 7MB.

Set [NODE_MODULES_CACHE](https://devcenter.heroku.com/articles/nodejs-support#cache-behavior)
to `false` when using the `yarn` package manager.

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

[Tailor Brands](https://github.com/TailorBrands) maintain
[Debian-based Dockerfiles for libvips and nodejs](https://github.com/TailorBrands/docker-libvips).

```sh
docker pull tailor/docker-libvips
```

### AWS Lambda

A [deployment package](http://docs.aws.amazon.com/lambda/latest/dg/nodejs-create-deployment-pkg.html) for the
[Lambda Execution Environment](http://docs.aws.amazon.com/lambda/latest/dg/current-supported-versions.html)
can be built using Docker.

```sh
rm -rf node_modules/sharp
docker run -v "$PWD":/var/task lambci/lambda:build-nodejs6.10 npm install
```

Set the Lambda runtime to Node.js 6.10.

To get the best performance select the largest memory available. A 1536 MB function provides ~12x more CPU time than a 128 MB function.

### NW.js

Run the `nw-gyp` tool after installation.

```sh
cd node-modules/sharp
nw-gyp rebuild --arch=x64 --target=[your nw version]
node node_modules/sharp/install/dll-copy
```

See also http://docs.nwjs.io/en/latest/For%20Users/Advanced/Use%20Native%20Node%20Modules/

### Build tools

* [gulp-responsive](https://www.npmjs.com/package/gulp-responsive)
* [grunt-sharp](https://www.npmjs.com/package/grunt-sharp)

### Coding tools

* [Sharp TypeScript Types](https://www.npmjs.com/package/@types/sharp)

### CLI tools

* [sharp-cli](https://www.npmjs.com/package/sharp-cli)

### Security

Many users of this module process untrusted, user-supplied images,
but there are aspects of security to consider when doing so.

It is possible to compile libvips with support for various third-party image loaders.
Each of these libraries has undergone differing levels of security testing.

Whilst tools such as [American Fuzzy Lop](http://lcamtuf.coredump.cx/afl/)
and [Valgrind](http://valgrind.org/) have been used to test
the most popular web-based formats, as well as libvips itself,
you are advised to perform your own testing and sandboxing.

ImageMagick in particular has a relatively large attack surface,
which can be partially mitigated with a
[policy.xml](http://www.imagemagick.org/script/resources.php)
configuration file to prevent the use of coders known to be vulnerable.

```xml
<policymap>
  <policy domain="coder" rights="none" pattern="EPHEMERAL" />
  <policy domain="coder" rights="none" pattern="URL" />
  <policy domain="coder" rights="none" pattern="HTTPS" />
  <policy domain="coder" rights="none" pattern="MVG" />
  <policy domain="coder" rights="none" pattern="MSL" />
  <policy domain="coder" rights="none" pattern="TEXT" />
  <policy domain="coder" rights="none" pattern="SHOW" />
  <policy domain="coder" rights="none" pattern="WIN" />
  <policy domain="coder" rights="none" pattern="PLT" />
</policymap>
```

Set the `MAGICK_CONFIGURE_PATH` environment variable
to the directory containing the `policy.xml` file.

### Pre-compiled libvips binaries

This module will attempt to download a pre-compiled bundle of libvips
and its dependencies on Linux and Windows machines under either of these
conditions:

1. If a global installation of libvips that meets the
minimum version requirement cannot be found;
1. If `SHARP_IGNORE_GLOBAL_LIBVIPS` environment variable is set.

```sh
SHARP_IGNORE_GLOBAL_LIBVIPS=1 npm install sharp
```

Should you need to manually download and inspect these files,
you can do so via https://github.com/lovell/sharp-libvips/releases

Should you wish to install these from your own location,
set the `SHARP_DIST_BASE_URL` environment variable, e.g.

```sh
SHARP_DIST_BASE_URL="https://hostname/path/" npm install sharp
```

to use `https://hostname/path/libvips-x.y.z-platform.tar.gz`.

### Licences

This module is licensed under the terms of the
[Apache 2.0 Licence](https://github.com/lovell/sharp/blob/master/LICENSE).

The libraries downloaded and used by this module
are done so under the terms of the following licences,
all of which are compatible with the Apache 2.0 Licence.

Use of libraries under the terms of the LGPLv3 is via the
"any later version" clause of the LGPLv2 or LGPLv2.1.

| Library       | Used under the terms of                                                                                  |
|---------------|----------------------------------------------------------------------------------------------------------|
| cairo         | Mozilla Public License 2.0                                                                               |
| expat         | MIT Licence                                                                                              |
| fontconfig    | [fontconfig Licence](https://cgit.freedesktop.org/fontconfig/tree/COPYING) (BSD-like)                    |
| freetype      | [freetype Licence](http://git.savannah.gnu.org/cgit/freetype/freetype2.git/tree/docs/FTL.TXT) (BSD-like) |
| giflib        | MIT Licence                                                                                              |
| glib          | LGPLv3                                                                                                   |
| harfbuzz      | MIT Licence                                                                                              |
| lcms          | MIT Licence                                                                                              |
| libcroco      | LGPLv3                                                                                                   |
| libexif       | LGPLv3                                                                                                   |
| libffi        | MIT Licence                                                                                              |
| libgsf        | LGPLv3                                                                                                   |
| libjpeg-turbo | [zlib License, IJG License](https://github.com/libjpeg-turbo/libjpeg-turbo/blob/master/LICENSE.md)       |
| libpng        | [libpng License](http://www.libpng.org/pub/png/src/libpng-LICENSE.txt)                                   |
| librsvg       | LGPLv3                                                                                                   |
| libtiff       | [libtiff License](http://www.libtiff.org/misc.html) (BSD-like)                                           |
| libvips       | LGPLv3                                                                                                   |
| libwebp       | New BSD License                                                                                          |
| libxml2       | MIT Licence                                                                                              |
| pango         | LGPLv3                                                                                                   |
| pixman        | MIT Licence                                                                                              |
| zlib          | [zlib Licence](https://github.com/madler/zlib/blob/master/zlib.h)                                        |
