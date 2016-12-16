FROM socialdefect/raspbian-jessie-core
MAINTAINER Lovell Fuller <npm@lovell.info>

# Create Rasbian-based container suitable for compiling Linux ARMv6 binaries
# Requires the QEMU user mode emulation binaries on the host machine

# Build dependencies
RUN \
  apt-get update && \
  apt-get install -y build-essential curl autoconf libtool nasm gtk-doc-tools texinfo advancecomp libglib2.0-dev jq

# Compiler settings
ENV \
  PLATFORM=linux-armv6 \
  FLAGS="-Os"
