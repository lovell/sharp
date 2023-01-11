#!/bin/sh

# cd to wasm-scripts directory if not already there
cd "${0%/*}"

[ -f wasm-vips/build/target/lib/pkgconfig/vips-cpp.pc ] || (
  mkdir -p wasm-vips
  curl -Ls https://github.com/kleisauke/wasm-vips/archive/73660c98483fbafe40e2f7b24b585b0ecca84aa5.tar.gz | tar xzC wasm-vips --strip-components=1
  cd wasm-vips
  npm run build -- --enable-lto --disable-modules --disable-jxl --disable-bindings --enable-libvips-cpp
)

docker run \
  --rm \
  -v "$PWD/wasm-vips:/src" \
  -v "$PWD/..:/sharp-src" \
  -w '/sharp-src' \
  wasm-vips \
    emmake \
      /bin/sh -c ' \
        PKG_CONFIG_LIBDIR=/src/build/target/lib/pkgconfig:$PKG_CONFIG_LIBDIR \
        npm install \
          --build-from-source \
          --arch=wasm32 \
          --nodedir=wasm-scripts \
      '
