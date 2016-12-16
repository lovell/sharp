FROM debian:stretch
MAINTAINER Lovell Fuller <npm@lovell.info>

# Create Debian-based container suitable for cross-compiling Linux ARMv8-A binaries

# Build dependencies
RUN \
  apt-get update && \
  apt-get install -y curl && \
  dpkg --add-architecture arm64 && \
  apt-get update && \
  apt-get install -y crossbuild-essential-arm64 autoconf libtool nasm gtk-doc-tools texinfo advancecomp libglib2.0-dev jq

# Compiler settings
ENV \
  PLATFORM=linux-armv8 \
  CHOST=aarch64-linux-gnu \
  FLAGS="-march=armv8-a -Os"
