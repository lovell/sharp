#!/bin/sh

# Install build dependencies
apk add --update make gcc g++ python nodejs

# Install libvips from aports/testing
apk add --update --repository http://dl-cdn.alpinelinux.org/alpine/edge/testing vips-dev
