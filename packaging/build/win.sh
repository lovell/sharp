#!/bin/sh
set -e

# Fetch and unzip
mkdir /vips
cd /vips
curl -L -O https://github.com/lovell/build-win64/releases/download/v${VERSION_VIPS}/vips-dev-w64-web-${VERSION_VIPS}.zip
unzip vips-dev-w64-web-${VERSION_VIPS}.zip

# Clean and zip
cd /vips/vips-dev-8.5
rm bin/libvipsCC-42.dll bin/libvips-cpp-42.dll bin/libgsf-win32-1-114.dll
cp bin/*.dll lib/
cp -r lib64/* lib/

echo "Creating tarball"
tar czf /packaging/libvips-${VERSION_VIPS}-${PLATFORM}.tar.gz include lib/glib-2.0 lib/libvips.lib lib/libglib-2.0.lib lib/libgobject-2.0.lib lib/*.dll
echo "Shrinking tarball"
advdef --recompress --shrink-insane /packaging/libvips-${VERSION_VIPS}-${PLATFORM}.tar.gz
