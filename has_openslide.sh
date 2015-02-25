#!/usr/bin/env sh

has_openslide() {
  pkg-config openslide --atleast-version=3.4.0
}

has_openslide > /dev/null

if test $? -eq 0; then
  echo true
else
  echo false
fi
