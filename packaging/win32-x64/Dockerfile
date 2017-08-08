FROM debian:stretch
MAINTAINER Lovell Fuller <npm@lovell.info>

# Create Debian-based container suitable for post-processing Windows x64 binaries

RUN apt-get update && apt-get install -y curl zip advancecomp

ENV PLATFORM=win32-x64
