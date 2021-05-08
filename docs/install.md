# Installation

```sh
npm install sharp
```

```sh
yarn add sharp
```

## Prerequisites

* Node.js v10+

## Prebuilt binaries

Ready-compiled sharp and libvips binaries are provided for use with
Node.js v10+ on the most common platforms:

* macOS x64 (>= 10.13)
* Linux x64 (glibc >= 2.17, musl >= 1.1.24)
* Linux ARM64 (glibc >= 2.29, musl >= 1.1.24)
* Windows x64
* Windows x86

An ~7.5MB tarball containing libvips and its most commonly used dependencies
is downloaded via HTTPS and stored within `node_modules/sharp/vendor` during `npm install`.

This provides support for the
JPEG, PNG, WebP, AVIF, TIFF, GIF (input) and SVG (input) image formats.

The following platforms have prebuilt libvips but not sharp:

* macOS ARM64
* Linux ARMv6
* Linux ARMv7 (glibc >= 2.28)
* Windows ARM64

The following platforms require compilation of both libvips and sharp from source:

* Linux x86
* Linux x64 (glibc <= 2.16, includes RHEL/CentOS 6)
* Linux ARM64 (glibc <= 2.28)
* Linux PowerPC
* FreeBSD
* OpenBSD

## Common problems

The architecture and platform of Node.js used for `npm install`
must be the same as the architecture and platform of Node.js used at runtime.

When using npm v6 or earlier, the `npm install --unsafe-perm` flag must be used when installing as `root` or a `sudo` user.

When using npm v7, the user running `npm install` must own the directory it is run in.

When installing cross platform prebuilts on linux hosts an installation can be forced by `--sharp-install-force` flag or by setting `SHARP_INSTALL_FORCE` env variable.

The `npm install --ignore-scripts=false` flag must be used when `npm` has been configured to ignore installation scripts.

Check the output of running `npm install --verbose sharp` for useful error messages.

## Apple M1

Prebuilt libvips binaries are provided for macOS on ARM64 (since sharp v0.28.0).

During `npm install` sharp will be built locally,
which requires Xcode and Python - see
[building from source](#building-from-source).

When this new ARM64 CPU is made freely available
to open source projects via a CI service
then prebuilt sharp binaries can also be provided.

## Custom libvips

To use a custom, globally-installed version of libvips instead of the provided binaries,
make sure it is at least the version listed under `config.libvips` in the `package.json` file
and that it can be located using `pkg-config --modversion vips-cpp`.

For help compiling libvips from source, please see
[https://libvips.github.io/libvips/install.html#building-libvips-from-a-source-tarball](https://libvips.github.io/libvips/install.html#building-libvips-from-a-source-tarball).

The use of a globally-installed libvips is unsupported on Windows.

## Building from source

This module will be compiled from source at `npm install` time when:

* a globally-installed libvips is detected (set the `SHARP_IGNORE_GLOBAL_LIBVIPS` environment variable to skip this),
* prebuilt sharp binaries do not exist for the current platform, or
* when the `npm install --build-from-source` flag is used.

Building from source requires:

* C++11 compiler
* [node-gyp](https://github.com/nodejs/node-gyp#installation) and its dependencies

## Custom prebuilt binaries

This is an advanced approach that most people will not require.

To install the prebuilt sharp binaries from a custom URL,
set the `sharp_binary_host` npm config option
or the `npm_config_sharp_binary_host` environment variable.

To install the prebuilt sharp binaries from a directory on the local filesystem,
set the `sharp_local_prebuilds` npm config option
or the `npm_config_sharp_local_prebuilds` environment variable.

To install the prebuilt libvips binaries from a custom URL,
set the `sharp_libvips_binary_host` npm config option
or the `npm_config_sharp_libvips_binary_host` environment variable.

The version subpath and file name are appended to these. There should be tarballs available
that are compressed with both gzip and Brotli, as the format downloaded will vary depending
on whether the user's version of Node supports Brotli decompression (Node.js v10.16.0+)

For example, if `sharp_libvips_binary_host` is set to `https://hostname/path`
and the libvips version is `1.2.3` then the resultant URL will be
`https://hostname/path/v1.2.3/libvips-1.2.3-platform-arch.tar.br` or 
`https://hostname/path/v1.2.3/libvips-1.2.3-platform-arch.tar.gz`.

See the Chinese mirror below for a further example.

## Chinese mirror

A mirror site based in China, provided by Alibaba, contains binaries for both sharp and libvips.

To use this either set the following configuration:

```sh
npm config set sharp_binary_host "https://npm.taobao.org/mirrors/sharp"
npm config set sharp_libvips_binary_host "https://npm.taobao.org/mirrors/sharp-libvips"
npm install sharp
```

or set the following environment variables:

```sh
npm_config_sharp_binary_host="https://npm.taobao.org/mirrors/sharp" \
  npm_config_sharp_libvips_binary_host="https://npm.taobao.org/mirrors/sharp-libvips" \
  npm install sharp
```

## FreeBSD

The `vips` package must be installed before `npm install` is run.

```sh
pkg install -y pkgconf vips
```

```sh
cd /usr/ports/graphics/vips/ && make install clean
```

## Linux memory allocator

The default memory allocator on most glibc-based Linux systems
(e.g. Debian, Red Hat) is unsuitable for long-running, multi-threaded
processes that involve lots of small memory allocations.

For this reason, by default, sharp will limit the use of thread-based
[concurrency](api-utility#concurrency) when the glibc allocator is
detected at runtime.

To help avoid fragmentation and improve performance on these systems,
the use of an alternative memory allocator such as
[jemalloc](https://github.com/jemalloc/jemalloc) is recommended.

Those using musl-based Linux (e.g. Alpine) and non-Linux systems are
unaffected.

## Heroku

Add the
[jemalloc buildpack](https://github.com/gaffneyc/heroku-buildpack-jemalloc)
to reduce the effects of memory fragmentation.

Set
[NODE_MODULES_CACHE](https://devcenter.heroku.com/articles/nodejs-support#cache-behavior)
to `false` when using the `yarn` package manager.

## AWS Lambda

The binaries in the `node_modules` directory of the
[deployment package](https://docs.aws.amazon.com/lambda/latest/dg/nodejs-package.html)
must be for the Linux x64 platform.

When building your deployment package on machines other than Linux x64 (glibc),
run the following commands:

macOS:
```sh
rm -rf node_modules/sharp
SHARP_IGNORE_GLOBAL_LIBVIPS=1 npm install --arch=x64 --platform=linux sharp
```

Windows:
```sh
rmdir /s /q node_modules/sharp
npm install --arch=x64 --platform=linux sharp
```

Alternatively a Docker container closely matching the Lambda runtime can be used:

```sh
rm -rf node_modules/sharp
docker run -v "$PWD":/var/task lambci/lambda:build-nodejs12.x npm install sharp
```

To get the best performance select the largest memory available.
A 1536 MB function provides ~12x more CPU time than a 128 MB function.

## Webpack

Ensure sharp is added to the
[externals](https://webpack.js.org/configuration/externals/)
configuration.

```js
externals: {
  'sharp': 'commonjs sharp'
}
```

## Worker threads

The main thread must call `require('sharp')`
before worker threads are created
to ensure shared libraries remain loaded in memory
until after all threads are complete.

## Known conflicts

### Canvas and Windows

The prebuilt binaries provided by `canvas` for Windows depend on the unmaintained GTK 2, last updated in 2011.

These conflict with the modern, up-to-date binaries provided by sharp.

If both modules are used in the same Windows process, the following error will occur:
```
The specified procedure could not be found.
```
