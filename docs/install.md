# Installation

```sh
npm install sharp
```

```sh
yarn add sharp
```

### Prerequisites

* Node v4+
* C++11 compatible compiler such as gcc 4.8+, clang 3.0+ or MSVC 2013+
* [node-gyp](https://github.com/TooTallNate/node-gyp#installation) and its dependencies

### Linux

[![Ubuntu 14.04 Build Status](https://travis-ci.org/lovell/sharp.png?branch=master)](https://travis-ci.org/lovell/sharp)
[![Linux Build Status](https://circleci.com/gh/lovell/sharp.svg?style=svg&circle-token=6cb6d1d287a51af83722b19ed8885377fbc85e5c)](https://circleci.com/gh/lovell/sharp)

libvips and its dependencies are fetched and stored within `node_modules/sharp/vendor` during `npm install`.
This involves an automated HTTPS download of approximately 6.5MB.

Most recent Linux-based operating systems with glibc running on x64 and ARMv6+ CPUs should "just work", e.g.:

* Debian 7, 8
* Ubuntu 12.04, 14.04, 16.04
* Centos 7
* Fedora 23, 24
* openSUSE 13.2
* Archlinux
* Raspbian Jessie
* Amazon Linux 2016.03, 2016.09

To use a globally-installed version of libvips instead of the provided binaries,
make sure it is at least the version listed under `config.libvips` in the `package.json` file
and that it can be located using `pkg-config --modversion vips-cpp`.

If you are using non-stadard paths (anything other than `/usr` or `/usr/local`),
you might need to set `PKG_CONFIG_PATH` during `npm install`
and `LD_LIBRARY_PATH` at runtime.

This allows the use of newer versions of libvips with older versions of sharp.

For 32-bit Intel CPUs and older Linux-based operating systems such as Centos 6,
it is recommended to install a system-wide installation of libvips from source:

https://github.com/jcupitt/libvips#building-libvips-from-a-source-tarball

For Linux-based operating systems such as Alpine that use musl libc,
the smaller stack size means libvips' cache should be disabled
via `sharp.cache(false)` to avoid a stack overflow.

### Mac OS

[![OS X 10.9.5 Build Status](https://travis-ci.org/lovell/sharp.png?branch=master)](https://travis-ci.org/lovell/sharp)

libvips and its dependencies are fetched and stored within `node_modules/sharp/vendor` during `npm install`.
This involves an automated HTTPS download of approximately 6.3MB.

To use your own version of libvips instead of the provided binaries, make sure it is
at least the version listed under `config.libvips` in the `package.json` file and
that it can be located using `pkg-config --modversion vips-cpp`.

### Windows x64

[![Windows x64 Build Status](https://ci.appveyor.com/api/projects/status/pgtul704nkhhg6sg)](https://ci.appveyor.com/project/lovell/sharp)

libvips and its dependencies are fetched and stored within `node_modules\sharp\vendor` during `npm install`.
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

### Licences

If a global installation of libvips that meets the
minimum version requirement cannot be found,
this module will download a pre-compiled bundle of libvips
and its dependencies on Linux and Windows machines.

Should you need to manually download and inspect these files,
you can do so via https://dl.bintray.com/lovell/sharp/

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
