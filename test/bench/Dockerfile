FROM ubuntu:23.10
ARG BRANCH=main

# Install basic dependencies
RUN apt-get -y update && apt-get install -y build-essential curl git ca-certificates gnupg

# Install latest Node.js LTS
RUN mkdir -p /etc/apt/keyrings
RUN curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg
RUN echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_20.x nodistro main" | tee /etc/apt/sources.list.d/nodesource.list
RUN apt-get -y update && apt-get install -y nodejs

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
