# Installation

```sh
npm install sharp
```

### Prerequisites

* C++11 compatible compiler such as gcc 4.8+, clang 3.0+ or MSVC 2013+
* [node-gyp](https://github.com/TooTallNate/node-gyp#installation)

### Linux

[![Ubuntu 14.04 Build Status](https://travis-ci.org/lovell/sharp.png?branch=master)](https://travis-ci.org/lovell/sharp)
[![Linux Build Status](https://circleci.com/gh/lovell/sharp.svg?style=svg&circle-token=6cb6d1d287a51af83722b19ed8885377fbc85e5c)](https://circleci.com/gh/lovell/sharp)

libvips and its dependencies are fetched and stored within `node_modules/sharp/lib` during `npm install`.
This involves an automated HTTPS download of approximately 6.7MB.

Most recent Linux-based operating systems with glibc running on x64 and ARMv6+ CPUs should "just work", e.g.:

* Debian 7, 8
* Ubuntu 12.04, 14.04, 15.10, 16.04
* Centos 7
* Fedora 22, 23
* openSUSE 13.2
* Archlinux 2015.06.01
* Raspbian Jessie
* Amazon Linux 2015.03, 2015.09

To use your own version of libvips instead of the provided binaries, make sure it is
at least the version listed under `config.libvips` in the `package.json` file,
that it can be located using `pkg-config --modversion vips-cpp`
and that it has been compiled with `_GLIBCXX_USE_CXX11_ABI=0`.

If you are using non-stadard paths (anything other than `/usr` or `/usr/local`),
you might need to set `PKG_CONFIG_PATH` during `npm install`
and `LD_LIBRARY_PATH` at runtime.

This allows the use of newer versions of libvips with older versions of sharp.

For 32-bit Intel CPUs and older Linux-based operating systems such as Centos 6,
a system-wide installation of the most suitable version of
libvips and its dependencies can be achieved by running
the following command as a user with `sudo` access
(requires `curl` and `pkg-config`):

```sh
# WARNING: This script is deprecated. You probably don't need to run it. Please read above.
curl -s https://raw.githubusercontent.com/lovell/sharp/master/preinstall.sh | sudo bash -
```

For Linux-based operating systems such as Alpine that use musl libc,
the smaller stack size means libvips' cache should be disabled
via `sharp.cache(false)` to avoid a stack overflow.

Beware of Linux OS upgrades that introduce v5.1+ of the `g++` compiler due to
[changes](https://gcc.gnu.org/onlinedocs/libstdc++/manual/using_dual_abi.html)
in the C++11 ABI.
This module assumes the previous behaviour, which can be enforced by setting the
`_GLIBCXX_USE_CXX11_ABI=0` environment variable at libvips' compile time.

### Mac OS

[![OS X 10.9.5 Build Status](https://travis-ci.org/lovell/sharp.png?branch=master)](https://travis-ci.org/lovell/sharp)

libvips must be installed before `npm install` is run.
This can be achieved via homebrew:

```sh
brew install homebrew/science/vips
```

For WebP suppport use:

```sh
brew install homebrew/science/vips --with-webp
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

### AWS Lambda

In order to use sharp on AWS Lambda, you need to [create a deployment package](http://docs.aws.amazon.com/lambda/latest/dg/nodejs-create-deployment-pkg.html). Because sharp
downloads and links libraries for the current platform during `npm install` you have to
do this on a system similar to the [Lambda Execution Environment](http://docs.aws.amazon.com/lambda/latest/dg/current-supported-versions.html). The easiest ways to do this, is to setup a
small t2.micro instance using the AMI ID listed in the previous link, ssh into it as ec2-user
and follow the instructions below.

Install dependencies:

```sh
curl -s https://rpm.nodesource.com/setup_4.x | sudo bash -
sudo yum install -y gcc-c++ nodejs
```

Copy your code and package.json to the instance using `scp` and create a deployment package:

```sh
cd sharp-lambda-example
npm install
zip -ur9 ../sharp-lambda-example.zip index.js node_modules
```

You can now download your deployment ZIP using `scp` and upload it to Lambda. Be sure to set your Lambda runtime to Node.js 4.3.

**Performance Tip:** To get the best performance on Lambda choose the largest memory available because this also gives you the most cpu time (a 1536 MB function is 12x faster than a 128 MB function).

### Build tools

* [gulp-responsive](https://www.npmjs.com/package/gulp-responsive)
* [grunt-sharp](https://www.npmjs.com/package/grunt-sharp)

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
