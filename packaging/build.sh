#!/bin/sh
set -e

if [ $# -lt 1 ]; then
  echo
  echo "Usage: $0 VERSION [PLATFORM]"
  echo "Build shared libraries for libvips and its dependencies via containers"
  echo
  echo "Please specify the libvips VERSION, e.g. 8.3.3"
  echo
  echo "Optionally build for only one PLATFORM, defaults to building for all"
  echo "Possible values for PLATFORM are: win32-x64, linux-x64, linux-armv6,"
  echo "linux-armv7, linux-armv8"
  echo
  exit 1
fi
VERSION_VIPS="$1"
PLATFORM="${2:-all}"

# Is docker available?
if ! type docker >/dev/null; then
  echo "Please install docker"
  exit 1
fi

# Update base images
for baseimage in debian:wheezy debian:jessie debian:stretch socialdefect/raspbian-jessie-core; do
  docker pull $baseimage
done

# Windows (x64)
if [ $PLATFORM = "all" ] || [ $PLATFORM = "win32-x64" ]; then
  echo "Building win32-x64..."
  docker build -t vips-dev-win32-x64 win32-x64
  docker run --rm -e "VERSION_VIPS=${VERSION_VIPS}" -v $PWD:/packaging vips-dev-win32-x64 sh -c "/packaging/build/win.sh"
fi

# Linux (x64, ARMv6, ARMv7, ARMv8)
for flavour in linux-x64 linux-armv6 linux-armv7 linux-armv8; do
  if [ $PLATFORM = "all" ] || [ $PLATFORM = $flavour ]; then
    echo "Building $flavour..."
    docker build -t vips-dev-$flavour $flavour
    docker run --rm -e "VERSION_VIPS=${VERSION_VIPS}" -v $PWD:/packaging vips-dev-$flavour sh -c "/packaging/build/lin.sh"
  fi
done

# Display checksums
sha256sum *.tar.gz
