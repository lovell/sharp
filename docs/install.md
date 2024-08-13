# Installation

Works with your choice of JavaScript package manager.

> ⚠️  **Please ensure your package manager is configured to install optional dependencies**

If a package manager lockfile must support multiple platforms,
please see the [cross-platform](#cross-platform) section
to help decide which package manager is appropriate.

```sh
npm install sharp
```

```sh
pnpm add sharp
```

```sh
yarn add sharp
```

```sh
# yarn v1 (maintenance mode)
yarn add sharp --ignore-engines
```

```sh
bun add sharp
```

```sh
deno run --allow-ffi ...
```

## Prerequisites

* Node-API v9 compatible runtime e.g. Node.js ^18.17.0 or >=20.3.0.

## Prebuilt binaries

Ready-compiled sharp and libvips binaries are provided for use on the most common platforms:

* macOS x64 (>= 10.13)
* macOS ARM64
* Linux ARM (glibc >= 2.28)
* Linux ARM64 (glibc >= 2.26, musl >= 1.2.2)
* Linux s390x (glibc >= 2.31)
* Linux x64 (glibc >= 2.26, musl >= 1.2.2, CPU with SSE4.2)
* Windows x64
* Windows x86

This provides support for the
JPEG, PNG, WebP, AVIF (limited to 8-bit depth), TIFF, GIF and SVG (input) image formats.

## Cross-platform

At install time, package managers will automatically select prebuilt binaries
for the current OS platform and CPU architecture, where available.

Some package managers support multiple platforms and architectures
within the same installation tree and/or using the same lockfile.

### npm v10+

> ⚠️ **npm `package-lock.json` files can cause installation problems due to [npm bug #4828](https://github.com/npm/cli/issues/4828)**

Provides limited support via `--os`, `--cpu` and `--libc` flags.

To support macOS with Intel x64 and ARM64 CPUs:
```sh
npm install --cpu=x64 --os=darwin sharp
npm install --cpu=arm64 --os=darwin sharp
```

When the cross-target is Linux, the C standard library must be specified.

To support glibc (e.g. Debian) and musl (e.g. Alpine) Linux with Intel x64 CPUs:
```sh
npm install --cpu=x64 --os=linux --libc=glibc sharp
npm install --cpu=x64 --os=linux --libc=musl sharp
```

### yarn v3+

Use the [supportedArchitectures](https://yarnpkg.com/configuration/yarnrc#supportedArchitectures) configuration.

### pnpm v8+

Use the [supportedArchitectures](https://pnpm.io/package_json#pnpmsupportedarchitectures) configuration.

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

* a globally-installed libvips is detected, or
* when the `npm install --build-from-source` flag is used.

The logic to detect a globally-installed libvips can be skipped by setting the
`SHARP_IGNORE_GLOBAL_LIBVIPS` (never try to use it) or
`SHARP_FORCE_GLOBAL_LIBVIPS` (always try to use it, even when missing or outdated)
environment variables.

Building from source requires:

* C++11 compiler
* [node-addon-api](https://www.npmjs.com/package/node-addon-api) version 7+
* [node-gyp](https://github.com/nodejs/node-gyp#installation) version 9+ and its dependencies

There is an install-time check for these dependencies.
If `node-addon-api` or `node-gyp` cannot be found, try adding them via:

```sh
npm install --save node-addon-api node-gyp
```

For cross-compiling, the `--platform`, `--arch` and `--libc` npm flags
(or the `npm_config_platform`, `npm_config_arch` and `npm_config_libc` environment variables)
can be used to configure the target environment.

## WebAssembly

Experimental support is provided for runtime environments that provide
multi-threaded Wasm via Workers.

Use in web browsers is unsupported.

Native text rendering is unsupported.

```sh
npm install --cpu=wasm32 sharp
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
must include binaries for either the linux-x64 or linux-arm64 platforms
depending on the chosen architecture.

When building your deployment package on a machine that differs from the target architecture,
see the [cross-platform](#cross-platform) section to help decide which package manager is appropriate
and how to configure it.

Some package managers use symbolic links
but AWS Lambda does not support these within deployment packages.

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
        - npm install --os=linux --cpu=x64 sharp
```

### electron

Ensure `sharp` is unpacked from the ASAR archive file using the
[asarUnpack](https://www.electron.build/configuration/configuration.html)
option.

```json
{
  "build": {
    "asar": true,
    "asarUnpack": [
      "**/node_modules/sharp/**/*",
      "**/node_modules/@img/**/*"
    ]
  }
}
```

### vite

Ensure `sharp` is excluded from bundling via the
[build.rollupOptions](https://vitejs.dev/config/build-options.html)
configuration.

```js
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    rollupOptions: {
      external: [
        "sharp"
      ]
    }
  }
});
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

## Known conflicts

### Canvas and Windows

If both `canvas` and `sharp` modules are used in the same Windows process, the following error may occur:
```
The specified procedure could not be found.
```
