FROM debian:jessie
MAINTAINER Lovell Fuller <npm@lovell.info>

# Create Debian-based container suitable for cross-compiling Linux ARMv7-A binaries

# Build dependencies
RUN \
  apt-get update && \
  apt-get install -y curl && \
  echo "deb http://emdebian.org/tools/debian/ jessie main" | tee /etc/apt/sources.list.d/crosstools.list && \
  curl http://emdebian.org/tools/debian/emdebian-toolchain-archive.key | apt-key add - && \
  dpkg --add-architecture armhf && \
  apt-get update && \
  apt-get install -y crossbuild-essential-armhf autoconf libtool nasm gtk-doc-tools texinfo advancecomp libglib2.0-dev jq

# Compiler settings
ENV \
  PLATFORM=linux-armv7 \
  CHOST=arm-linux-gnueabihf \
  FLAGS="-marm -march=armv7-a -mfpu=neon-vfpv4 -mfloat-abi=hard -Os"
