#!/bin/sh
set -e

# Fetch and unzip
mkdir /vips
cd /vips
curl -L -O https://github.com/lovell/build-win64/releases/download/v${VERSION_VIPS}/vips-dev-w64-web-${VERSION_VIPS}.zip
unzip vips-dev-w64-web-${VERSION_VIPS}.zip

# Clean and zip
cd /vips/vips-dev-8.4
rm bin/libvipsCC-42.dll bin/libvips-cpp-42.dll bin/libgsf-win32-1-114.dll
cp bin/*.dll lib/
cp -r lib64/* lib/

# Temp patch for __declspec ordering
curl -L -o include/vips/VImage8.h https://raw.githubusercontent.com/lovell/libvips/e1aef0445bf123d2de000bc7f2ef97b9f788eea0/cplusplus/include/vips/VImage8.h

echo "Creating tarball"
tar czf /packaging/libvips-${VERSION_VIPS}-${PLATFORM}.tar.gz include lib/glib-2.0 lib/libvips.lib lib/libglib-2.0.lib lib/libgobject-2.0.lib lib/*.dll
echo "Shrinking tarball"
advdef --recompress --shrink-insane /packaging/libvips-${VERSION_VIPS}-${PLATFORM}.tar.gz
