FROM debian:wheezy
MAINTAINER Lovell Fuller <npm@lovell.info>

# Create Debian-based container suitable for building Linux x64 binaries

# Build dependencies
RUN \
  apt-get update && \
  apt-get install -y build-essential autoconf libtool nasm gtk-doc-tools texinfo advancecomp

# Compiler settings
ENV \
  PLATFORM="linux-x64" \
  FLAGS="-O3"
