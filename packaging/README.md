# Packaging scripts

libvips and its dependencies are provided as pre-compiled shared libraries
for the most common operating systems and CPU architectures.

During `npm install`, these binaries are fetched as tarballs from
[Bintray](https://dl.bintray.com/lovell/sharp/) via HTTPS
and stored locally within `node_modules/sharp`.

## Using a custom tarball

A custom tarball stored on the local filesystem can be used instead.
Place it in the following location, where `x.y.z` is the libvips version,
`platform` is the value of `process.platform` and
`arch` is the value of `process.arch` (plus the version number for ARM).

`node_modules/sharp/packaging/libvips-x.y.z-platform-arch.tar.gz`

For example, for libvips v8.3.3 on an ARMv6 Linux machine, use:

`node_modules/sharp/packaging/libvips-8.3.3-linux-armv6.tar.gz`

Remove any `sharp/lib` and `sharp/include` directories
before running `npm install` again.

## Creating a tarball

Most people will not need to do this; proceed with caution.

The `packaging` directory contains the top-level [build script](build.sh).

### Linux

One [build script](build/lin.sh) is used to (cross-)compile
the same shared libraries within multiple containers.

* [x64](linux-x64/Dockerfile)
* [ARMv6](linux-armv6/Dockerfile)
* [ARMv7-A](linux-armv7/Dockerfile)
* [ARMv8-A](linux-armv8/Dockerfile)

The QEMU user mode emulation binaries are required to build for
the ARMv6 platform as the Debian armhf cross-compiler erroneously
generates unsupported Thumb 2 instructions.

```sh
sudo apt-get install qemu-user-static
```

### Windows

The output of libvips' [build-win64](https://github.com/jcupitt/build-win64)
"web" target is [post-processed](build/win.sh) within a [container](win32-x64/Dockerfile).

### OS X

See [package-libvips-darwin](https://github.com/lovell/package-libvips-darwin).
