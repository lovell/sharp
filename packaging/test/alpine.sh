#!/bin/sh

# Install build dependencies
apk add --update make gcc g++ python nodejs

# Install libvips with build headers and dependencies
apk add libvips-dev --update --repository https://s3.amazonaws.com/wjordan-apk --allow-untrusted
