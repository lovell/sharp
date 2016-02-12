#!/bin/sh

# Install Node.js
apk add --update make gcc g++ python nodejs

# Install libvips dependencies
apk add --update glib-dev libpng libwebp libexif libxml2 orc fftw lcms2
