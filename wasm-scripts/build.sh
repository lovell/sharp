#!/bin/sh

# cd to wasm-scripts directory if not already there
cd "${0%/*}"

[ -f wasm-vips/build/target/lib/pkgconfig/vips-cpp.pc ] || (
  mkdir -p wasm-vips
  curl -Ls https://github.com/kleisauke/wasm-vips/archive/1004691855974b1114d56e53c99fe87650576865.tar.gz | tar xzC wasm-vips --strip-components=1
  cd wasm-vips
  npm run build -- --enable-lto --disable-modules --disable-jxl --disable-svg --disable-bindings --enable-libvips-cpp
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
