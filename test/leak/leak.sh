#!/usr/bin/env bash
set -e

if ! type valgrind >/dev/null; then
  echo "Please install valgrind before running memory leak tests"
  exit 1
fi

curl -s -o ./test/leak/libvips.supp https://raw.githubusercontent.com/libvips/libvips/master/suppressions/valgrind.supp

TESTS=$(ls test/unit --ignore=svg.js --ignore=text.js)
for test in $TESTS; do
  G_SLICE=always-malloc G_DEBUG=gc-friendly VIPS_LEAK=1 VIPS_NOVECTOR=1 valgrind \
    --suppressions=test/leak/libvips.supp \
    --suppressions=test/leak/sharp.supp \
    --gen-suppressions=yes \
    --leak-check=full \
    --show-leak-kinds=definite,indirect \
    --num-callers=20 \
    --trace-children=yes \
    node --zero-fill-buffers --test "test/unit/$test";
done
