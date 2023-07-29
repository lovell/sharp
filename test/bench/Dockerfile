FROM ubuntu:22.04
ARG BRANCH=main

# Install basic dependencies
RUN apt-get -y update && apt-get install -y build-essential curl git

# Install latest Node.js LTS
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
RUN apt-get install -y nodejs

# Install benchmark dependencies
RUN apt-get install -y imagemagick libmagick++-dev graphicsmagick

# Install sharp
RUN mkdir /tmp/sharp
RUN cd /tmp && git clone --single-branch --branch $BRANCH https://github.com/lovell/sharp.git
RUN cd /tmp/sharp && npm install --build-from-source

# Install benchmark test
RUN cd /tmp/sharp/test/bench && npm install --omit optional

RUN cat /etc/os-release | grep VERSION=
RUN node -v

WORKDIR /tmp/sharp/test/bench

# Workaround for: https://github.com/emscripten-core/emscripten/pull/16917
# This could be removed once Squoosh is an optional dependency.
ENV NODE_OPTIONS="--no-experimental-fetch"

CMD [ "node", "perf" ]
