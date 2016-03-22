#!/bin/sh

VERSION_VIPS=8.2.3

# Is docker available?

if ! type docker >/dev/null; then
  echo "Please install docker"
  exit 1
fi

# TODO: docker v1.9.0 will allow build-time args - https://github.com/docker/docker/pull/15182

# Windows

docker build -t vips-dev-win win
WIN_CONTAINER_ID=$(docker run -d vips-dev-win)
docker cp "${WIN_CONTAINER_ID}:/libvips-${VERSION_VIPS}-win.tar.gz" .
docker rm "${WIN_CONTAINER_ID}"

# Linux

docker build -t vips-dev-lin lin
LIN_CONTAINER_ID=$(docker run -d vips-dev-lin)
docker cp "${LIN_CONTAINER_ID}:/libvips-${VERSION_VIPS}-lin.tar.gz" .
docker rm "${LIN_CONTAINER_ID}"

# Checksums

sha256sum *.tar.gz
