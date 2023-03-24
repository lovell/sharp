# Installation

```sh
npm install sharp
```

```sh
yarn add sharp
```

## Prerequisites

* Node.js >= 14.15.0

## Prebuilt binaries

Ready-compiled sharp and libvips binaries are provided for use on the most common platforms:

* macOS x64 (>= 10.13)
* macOS ARM64
* Linux x64 (glibc >= 2.17, musl >= 1.1.24, CPU with SSE4.2)
* Linux ARM64 (glibc >= 2.17, musl >= 1.1.24)
* Windows x64
* Windows x86

A ~7MB tarball containing libvips and its most commonly used dependencies
is downloaded via HTTPS, verified via Subresource Integrity
and decompressed into `node_modules/sharp/vendor` during `npm install`.

This provides support for the
JPEG, PNG, WebP, AVIF (limited to 8-bit depth), TIFF, GIF and SVG (input) image formats.

The following platforms have prebuilt libvips but not sharp:

* Linux ARMv7 (glibc >= 2.28)
* Linux ARMv6 (glibc >= 2.28)
* Windows ARM64

The following platforms require compilation of both libvips and sharp from source:

* Linux x86
* Linux ARMv7 (glibc <= 2.27, musl)
* Linux ARMv6 (glibc <= 2.27, musl)
* Linux PowerPC
* FreeBSD
* OpenBSD

## Common problems

The architecture and platform of Node.js used for `npm install`
must be the same as the architecture and platform of Node.js used at runtime.
See the [cross-platform](#cross-platform) section if this is not the case.

When using npm v6 or earlier, the `npm install --unsafe-perm` flag must be used when installing as `root` or a `sudo` user.

When using npm v7 or later, the user running `npm install` must own the directory it is run in.

The `npm install --ignore-scripts=false` flag must be used when `npm` has been configured to ignore installation scripts.

Check the output of running `npm install --verbose --foreground-scripts sharp` for useful error messages.

## Apple M1

Prebuilt sharp and libvips binaries have been provided for macOS on ARM64 since sharp v0.29.0.

## Cross-platform

At `npm install` time, prebuilt binaries are automatically selected for the
current OS platform and CPU architecture, where available.

The target platform and/or architecture can be manually selected using the following flags.

```sh
npm install --platform=... --arch=... --arm-version=... sharp
```

* `--platform`: one of `linux`, `darwin` or `win32`.
* `--arch`: one of `x64`, `ia32`, `arm` or `arm64`.
* `--arm-version`: one of `6`, `7` or `8` (`arm` defaults to `6`, `arm64` defaults to `8`).
* `--libc`: one of `glibc` or `musl`. This option only works with platform `linux`, defaults to `glibc`
* `--sharp-install-force`: skip version compatibility and Subresource Integrity checks.

These values can also be set via environment variables,
`npm_config_platform`, `npm_config_arch`, `npm_config_arm_version`, `npm_config_libc`
and `SHARP_INSTALL_FORCE` respectively.

For example, if the target machine has a 64-bit ARM CPU and is running Alpine Linux,
use the following flags:

```sh
npm install --arch=arm64 --platform=linux --libc=musl sharp
```

If the current machine is Alpine Linux and the target machine is Debian Linux on x64 cpu,
use the following flags:

```sh
npm install --arch=x64 --platform=linux --libc=glibc sharp
```

Multiple platforms and architectures can be supported within the same installation tree.
The following example for macOS installs x64 binaries then adds (via a rebuild) arm64 binaries:

```sh
npm install --platform=darwin --arch=x64 sharp
npm rebuild --platform=darwin --arch=arm64 sharp
```

## Custom libvips

To use a custom, globally-installed version of libvips instead of the provided binaries,
make sure it is at least the version listed under `config.libvips` in the `package.json` file
and that it can be located using `pkg-config --modversion vips-cpp`.

For help compiling libvips and its dependencies, please see
[building libvips from source](https://www.libvips.org/install.html#building-libvips-from-source).

The use of a globally-installed libvips is unsupported on Windows
and on macOS when running Node.js under Rosetta.

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

### Prebuilt sharp binaries

To install the prebuilt sharp binaries from a custom URL,
set the `sharp_binary_host` npm config option
or the `npm_config_sharp_binary_host` environment variable.

To install the prebuilt sharp binaries from a directory on the local filesystem,
set the `sharp_local_prebuilds` npm config option
or the `npm_config_sharp_local_prebuilds` environment variable.

URL example:
if `sharp_binary_host` is set to `https://hostname/path`
and the sharp version is `1.2.3` then the resultant URL will be
`https://hostname/path/v1.2.3/sharp-v1.2.3-napi-v5-platform-arch.tar.gz`.

Filename example:
if `sharp_local_prebuilds` is set to `/path`
and the sharp version is `1.2.3` then the resultant filename will be
`/path/sharp-v1.2.3-napi-v5-platform-arch.tar.gz`.

### Prebuilt libvips binaries

To install the prebuilt libvips binaries from a custom URL,
set the `sharp_libvips_binary_host` npm config option
or the `npm_config_sharp_libvips_binary_host` environment variable.

To install the prebuilt libvips binaries from a directory on the local filesystem,
set the `sharp_libvips_local_prebuilds` npm config option
or the `npm_config_sharp_libvips_local_prebuilds` environment variable.

The version subpath and filename are appended to these.

URL example:
if `sharp_libvips_binary_host` is set to `https://hostname/path`
and the libvips version is `4.5.6` then the resultant URL will be
`https://hostname/path/v4.5.6/libvips-4.5.6-platform-arch.tar.br`.

Filename example:
if `sharp_libvips_local_prebuilds` is set to `/path`
and the libvips version is `4.5.6` then the resultant filename will be
`/path/v4.5.6/libvips-4.5.6-platform-arch.tar.br`.

See the Chinese mirror below for a further example.

If these binaries are modified, new integrity hashes can be provided
at install time via `npm_package_config_integrity_platform_arch`
environment variables, for example set
`npm_package_config_integrity_linux_x64` to `sha512-abc...`.

The integrity hash of a file can be generated via:
```sh
sha512sum libvips-x.y.z-platform-arch.tar.br | cut -f1 -d' ' | xxd -r -p | base64 -w 0
```

## Chinese mirror

A mirror site based in China, provided by Alibaba, contains binaries for both sharp and libvips.

To use this either set the following configuration:

```sh
npm config set sharp_binary_host "https://npmmirror.com/mirrors/sharp"
npm config set sharp_libvips_binary_host "https://npmmirror.com/mirrors/sharp-libvips"
npm install sharp
```

or set the following environment variables:

```sh
npm_config_sharp_binary_host="https://npmmirror.com/mirrors/sharp" \
  npm_config_sharp_libvips_binary_host="https://npmmirror.com/mirrors/sharp-libvips" \
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

## AWS Lambda

The `node_modules` directory of the
[deployment package](https://docs.aws.amazon.com/lambda/latest/dg/nodejs-package.html)
must include binaries for the Linux x64 platform.

When building your deployment package on machines other than Linux x64 (glibc),
run the following additional command after `npm install`:

```sh
npm install
rm -rf node_modules/sharp
SHARP_IGNORE_GLOBAL_LIBVIPS=1 npm install --arch=x64 --platform=linux --libc=glibc sharp
```

To get the best performance select the largest memory available.
A 1536 MB function provides ~12x more CPU time than a 128 MB function.

When integrating with AWS API Gateway, ensure it is configured with the relevant
[binary media types](https://docs.aws.amazon.com/apigateway/latest/developerguide/api-gateway-payload-encodings.html).

## Bundlers

### webpack

Ensure sharp is excluded from bundling via the
[externals](https://webpack.js.org/configuration/externals/)
configuration.

```js
externals: {
  'sharp': 'commonjs sharp'
}
```

### esbuild

Ensure sharp is excluded from bundling via the
[external](https://esbuild.github.io/api/#external)
configuration.

```js
buildSync({
  entryPoints: ['app.js'],
  bundle: true,
  platform: 'node',
  external: ['sharp'],
})
```

```sh
esbuild app.js --bundle --platform=node --external:sharp
```

For `serverless-esbuild`, ensure platform-specific binaries are installed
via the `serverless.yml` configuration.

```yaml
custom:
  esbuild:
    external:
      - sharp
    packagerOptions:
      scripts:
        - npm install --arch=x64 --platform=linux sharp
```

## TypeScript

TypeScript definitions are published as part of
the `sharp` package from v0.32.0.

Previously these were available via the `@types/sharp` package,
which is now deprecated.

When using Typescript, please ensure `devDependencies` includes
the `@types/node` package.

## Fonts

When creating text images or rendering SVG images that contain text elements,
`fontconfig` is used to find the relevant fonts.

On Windows and macOS systems, all system fonts are available for use.

On macOS systems using Homebrew, you may need to set the
`PANGOCAIRO_BACKEND` environment variable to a value of `fontconfig`
to ensure it is used for font discovery instead of Core Text.

On Linux systems, fonts that include the relevant
[`fontconfig` configuration](https://www.freedesktop.org/software/fontconfig/fontconfig-user.html)
when installed via package manager are available for use.

If `fontconfig` configuration is not found, the following error will occur:
```
Fontconfig error: Cannot load default config file
```

In serverless environments where there is no control over font packages,
use the `FONTCONFIG_PATH` environment variable to point to a custom location.

Embedded SVG fonts are unsupported.

## Worker threads

On some platforms, including glibc-based Linux,
the main thread must call `require('sharp')`
_before_ worker threads are created.
This is to ensure shared libraries remain loaded in memory
until after all threads are complete.

Without this, the following error may occur:
```
Module did not self-register
```

## Known conflicts

### Canvas and Windows

The prebuilt binaries provided by `canvas` for Windows
from v2.7.0 onwards depend on the Visual C++ Runtime (MSVCRT).
These conflict with the binaries provided by sharp,
which depend on the more modern Universal C Runtime (UCRT).

See [Automattic/node-canvas#2155](https://github.com/Automattic/node-canvas/issues/2155).

If both modules are used in the same Windows process, the following error will occur:
```
The specified procedure could not be found.
```
