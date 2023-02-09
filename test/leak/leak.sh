#!/bin/sh

if ! type valgrind >/dev/null; then
  echo "Please install valgrind before running memory leak tests"
  exit 1
fi

curl -s -o ./test/leak/libvips.supp https://raw.githubusercontent.com/libvips/libvips/master/suppressions/valgrind.supp

for test in ./test/unit/*.js; do
  G_SLICE=always-malloc G_DEBUG=gc-friendly VIPS_LEAK=1 VIPS_NOVECTOR=1 valgrind \
    --suppressions=test/leak/libvips.supp \
    --suppressions=test/leak/sharp.supp \
    --gen-suppressions=yes \
    --leak-check=full \
    --show-leak-kinds=definite,indirect,possible \
    --num-callers=20 \
    --trace-children=yes \
    node --expose-gc node_modules/.bin/mocha --no-config --slow=60000 --timeout=120000 --require test/beforeEach.js "$test";
done
