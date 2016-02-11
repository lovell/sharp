#!/bin/sh

# Install Node.js
apk add --update make gcc g++ python nodejs

# Install libvips dependencies
apk add --update glib-dev libpng-dev libwebp-dev libexif-dev libxml2-dev orc-dev fftw-dev lcms2-dev
