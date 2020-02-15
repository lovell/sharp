# Installation

```sh
npm install sharp
```

```sh
yarn add sharp
```

## Prerequisites

* Node.js v10.16.0+

## Prebuilt binaries

Ready-compiled sharp and libvips binaries are provided for use with
Node.js v10.16.0+ (N-API v4) on the most common platforms:

* macOS x64 (>= 10.13)
* Linux x64 (glibc >= 2.17, musl >= 1.1.24)
* Windows x64 with 64-bit `node.exe`

A ~10MB tarball containing libvips and its most commonly used dependencies
is downloaded via HTTPS and stored within `node_modules/sharp/vendor` during `npm install`.

This provides support for the
JPEG, PNG, WebP, TIFF, GIF (input) and SVG (input) image formats.

The following platforms have prebuilt libvips but not sharp:

* Linux ARMv6
* Linux ARMv7
* Linux ARM64 (glibc >= 2.29)

The following platforms require compilation of both libvips and sharp from source:

* Linux x86
* Linux x64 (glibc <= 2.16, includes RHEL/CentOS 6)
* Linux ARM64 (glibc <= 2.28, musl)
* Linux PowerPC
* FreeBSD
* OpenBSD

The following platforms are completely unsupported:

* Windows x86
* Windows x64 with 32-bit `node.exe`

## Common problems

The platform and major version of Node.js used for `npm install`
must be the same as the platform and major version of Node.js used at runtime.

The `npm install --unsafe-perm` flag must be used when installing as `root` or a `sudo` user.

The `npm install --ignore-scripts=false` flag must be used when `npm` has been configured to ignore installation scripts.

Check the output of running `npm install --verbose sharp` for useful error messages.

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
* prebuilt binaries do not exist for the current platform and Node.js version, or
* when the `npm install --build-from-source` flag is used.

Building from source requires:

* C++11 compatible compiler such as gcc 4.8+, clang 3.0+ or MSVC 2013+
* [node-gyp](https://github.com/nodejs/node-gyp#installation) and its dependencies (includes Python 2.7)

## Custom prebuilt binaries

This is an advanced approach that most people will not require.

To install the prebuilt libvips binaries from a custom URL,
set the `sharp_dist_base_url` npm config option
or the `SHARP_DIST_BASE_URL` environment variable.

For example, both of the following will result in an attempt to download the file located at
`https://hostname/path/libvips-x.y.z-platform.tar.gz`.

```sh
npm config set sharp_dist_base_url "https://hostname/path/"
npm install sharp
```

```sh
SHARP_DIST_BASE_URL="https://hostname/path/" npm install sharp
```

To install the prebuilt sharp binaries from a custom URL, please see
[https://github.com/prebuild/prebuild-install#custom-binaries](https://github.com/prebuild/prebuild-install#custom-binaries)

## FreeBSD

The `vips` package must be installed before `npm install` is run.

```sh
pkg install -y pkgconf vips
```

```sh
cd /usr/ports/graphics/vips/ && make install clean
```

## Heroku

Add the
[jemalloc buildpack](https://github.com/gaffneyc/heroku-buildpack-jemalloc)
to reduce the effects of memory fragmentation.

Set
[NODE_MODULES_CACHE](https://devcenter.heroku.com/articles/nodejs-support#cache-behavior)
to `false` when using the `yarn` package manager.

## AWS Lambda

Set the Lambda runtime to `nodejs10.x`.

The binaries in the `node_modules` directory of the
[deployment package](https://docs.aws.amazon.com/lambda/latest/dg/nodejs-create-deployment-pkg.html)
must be for the Linux x64 platform.

On machines other than Linux x64, such as macOS and Windows, run the following:

```sh
rm -rf node_modules/sharp
npm install --arch=x64 --platform=linux --target=10.15.0 sharp
```

Alternatively a Docker container closely matching the Lambda runtime can be used:

```sh
rm -rf node_modules/sharp
docker run -v "$PWD":/var/task lambci/lambda:build-nodejs10.x npm install sharp
```

To get the best performance select the largest memory available.
A 1536 MB function provides ~12x more CPU time than a 128 MB function.

## Electron

Electron provides versions of the V8 JavaScript engine
that are incompatible with Node.js.
To ensure the correct binaries are used, run the following:

```sh
npm install
npx electron-rebuild
```

Further help can be found at
[https://electronjs.org/docs/tutorial/using-native-node-modules](https://electronjs.org/docs/tutorial/using-native-node-modules)
