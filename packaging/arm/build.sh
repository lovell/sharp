#!/bin/sh

# To be run inside a Raspbian container

# Working directories
DEPS=/deps
TARGET=/target
mkdir ${DEPS}
mkdir ${TARGET}

# Common build paths and flags
export PKG_CONFIG_PATH="${PKG_CONFIG_PATH}:${TARGET}/lib/pkgconfig"
export PATH="${PATH}:${TARGET}/bin"
export CPPFLAGS="-I${TARGET}/include"
export LDFLAGS="-L${TARGET}/lib"
export CFLAGS="-O3"
export CXXFLAGS="-O3"

# Dependency version numbers
VERSION_ZLIB=1.2.8
VERSION_FFI=3.2.1
VERSION_GLIB=2.48.0
VERSION_XML2=2.9.4
VERSION_GSF=1.14.36
VERSION_EXIF=0.6.21
VERSION_LCMS2=2.7
VERSION_JPEG=1.5.0
VERSION_PNG16=1.6.23
VERSION_WEBP=0.5.0
VERSION_TIFF=4.0.6
VERSION_ORC=0.4.25
VERSION_GDKPIXBUF=2.34.0
VERSION_FREETYPE=2.6.3
VERSION_FONTCONFIG=2.11.95
VERSION_HARFBUZZ=1.2.6
VERSION_PIXMAN=0.34.0
VERSION_CAIRO=1.14.6
VERSION_PANGO=1.40.1
VERSION_CROCO=0.6.11
VERSION_SVG=2.40.15
VERSION_GIF=5.1.4
VERSION_VIPS=8.3.1

# Least out-of-sync Sourceforge mirror
SOURCEFORGE_MIRROR=netix

mkdir ${DEPS}/zlib
curl -Ls http://zlib.net/zlib-${VERSION_ZLIB}.tar.xz | tar xJC ${DEPS}/zlib --strip-components=1
cd ${DEPS}/zlib
./configure --prefix=${TARGET} && make install
rm ${TARGET}/lib/libz.a

mkdir ${DEPS}/ffi
curl -Ls ftp://sourceware.org/pub/libffi/libffi-${VERSION_FFI}.tar.gz | tar xzC ${DEPS}/ffi --strip-components=1
cd ${DEPS}/ffi
./configure --prefix=${TARGET} --enable-shared --disable-static --disable-dependency-tracking --disable-builddir && make install-strip

mkdir ${DEPS}/glib
curl -Ls https://download.gnome.org/sources/glib/2.48/glib-${VERSION_GLIB}.tar.xz | tar xJC ${DEPS}/glib --strip-components=1
cd ${DEPS}/glib
./configure --prefix=${TARGET} --enable-shared --disable-static --disable-dependency-tracking --with-pcre=internal && make install-strip

mkdir ${DEPS}/xml2
curl -Ls http://xmlsoft.org/sources/libxml2-${VERSION_XML2}.tar.gz | tar xzC ${DEPS}/xml2 --strip-components=1
cd ${DEPS}/xml2
./configure --prefix=${TARGET} --enable-shared --disable-static --disable-dependency-tracking --without-python --with-zlib=${TARGET} && make install-strip

mkdir ${DEPS}/gsf
curl -Ls https://download.gnome.org/sources/libgsf/1.14/libgsf-${VERSION_GSF}.tar.xz | tar xJC ${DEPS}/gsf --strip-components=1
cd ${DEPS}/gsf
./configure --prefix=${TARGET} --enable-shared --disable-static --disable-dependency-tracking && make install-strip

mkdir ${DEPS}/exif
curl -Ls http://${SOURCEFORGE_MIRROR}.dl.sourceforge.net/project/libexif/libexif/${VERSION_EXIF}/libexif-${VERSION_EXIF}.tar.bz2 | tar xjC ${DEPS}/exif --strip-components=1
cd ${DEPS}/exif
./configure --prefix=${TARGET} --enable-shared --disable-static --disable-dependency-tracking && make install-strip

mkdir ${DEPS}/lcms2
curl -Ls http://${SOURCEFORGE_MIRROR}.dl.sourceforge.net/project/lcms/lcms/${VERSION_LCMS2}/lcms2-${VERSION_LCMS2}.tar.gz | tar xzC ${DEPS}/lcms2 --strip-components=1
cd ${DEPS}/lcms2
./configure --prefix=${TARGET} --enable-shared --disable-static --disable-dependency-tracking && make install-strip

mkdir ${DEPS}/jpeg
curl -Ls https://github.com/libjpeg-turbo/libjpeg-turbo/archive/${VERSION_JPEG}.tar.gz | tar xzC ${DEPS}/jpeg --strip-components=1
cd ${DEPS}/jpeg
autoreconf -fiv && ./configure --prefix=${TARGET} --enable-shared --disable-static --disable-dependency-tracking --with-jpeg8 --without-turbojpeg && make install-strip

mkdir ${DEPS}/png16
curl -Ls http://${SOURCEFORGE_MIRROR}.dl.sourceforge.net/project/libpng/libpng16/${VERSION_PNG16}/libpng-${VERSION_PNG16}.tar.xz | tar xJC ${DEPS}/png16 --strip-components=1
cd ${DEPS}/png16
./configure --prefix=${TARGET} --enable-shared --disable-static --disable-dependency-tracking && make install-strip

mkdir ${DEPS}/webp
curl -Ls http://downloads.webmproject.org/releases/webp/libwebp-${VERSION_WEBP}.tar.gz | tar xzC ${DEPS}/webp --strip-components=1
cd ${DEPS}/webp
./configure --prefix=${TARGET} --enable-shared --disable-static --disable-dependency-tracking && make install-strip

mkdir ${DEPS}/tiff
curl -Ls http://download.osgeo.org/libtiff/tiff-${VERSION_TIFF}.tar.gz | tar xzC ${DEPS}/tiff --strip-components=1
cd ${DEPS}/tiff
./configure --prefix=${TARGET} --enable-shared --disable-static --disable-dependency-tracking && make install-strip
rm ${TARGET}/lib/libtiffxx*

mkdir ${DEPS}/orc
curl -Ls http://gstreamer.freedesktop.org/data/src/orc/orc-${VERSION_ORC}.tar.xz | tar xJC ${DEPS}/orc --strip-components=1
cd ${DEPS}/orc
./configure --prefix=${TARGET} --enable-shared --disable-static --disable-dependency-tracking && make install-strip

mkdir ${DEPS}/gdkpixbuf
curl -Ls https://download.gnome.org/sources/gdk-pixbuf/2.34/gdk-pixbuf-${VERSION_GDKPIXBUF}.tar.xz | tar xJC ${DEPS}/gdkpixbuf --strip-components=1
cd ${DEPS}/gdkpixbuf
LD_LIBRARY_PATH=${TARGET}/lib ./configure --prefix=${TARGET} --enable-shared --disable-static --disable-dependency-tracking \
  --disable-introspection --disable-modules --without-libpng --without-libjpeg --without-libtiff --without-gdiplus --with-included-loaders= \
  && make install-strip

mkdir ${DEPS}/freetype
curl -Ls http://download.savannah.gnu.org/releases/freetype/freetype-${VERSION_FREETYPE}.tar.gz | tar xzC ${DEPS}/freetype --strip-components=1
cd ${DEPS}/freetype
./configure --prefix=${TARGET} --enable-shared --disable-static && make install

mkdir ${DEPS}/fontconfig
curl -Ls https://www.freedesktop.org/software/fontconfig/release/fontconfig-${VERSION_FONTCONFIG}.tar.bz2 | tar xjC ${DEPS}/fontconfig --strip-components=1
cd ${DEPS}/fontconfig
./configure --prefix=${TARGET} --enable-shared --disable-static --disable-dependency-tracking --enable-libxml2 && make install-strip

mkdir ${DEPS}/harfbuzz
curl -Ls https://www.freedesktop.org/software/harfbuzz/release/harfbuzz-${VERSION_HARFBUZZ}.tar.bz2 | tar xjC ${DEPS}/harfbuzz --strip-components=1
cd ${DEPS}/harfbuzz
./configure --prefix=${TARGET} --enable-shared --disable-static --disable-dependency-tracking && make install-strip

mkdir ${DEPS}/pixman
curl -Ls http://cairographics.org/releases/pixman-${VERSION_PIXMAN}.tar.gz | tar xzC ${DEPS}/pixman --strip-components=1
cd ${DEPS}/pixman
./configure --prefix=${TARGET} --enable-shared --disable-static --disable-dependency-tracking --disable-libpng --disable-arm-iwmmxt && make install-strip

mkdir ${DEPS}/cairo
curl -Ls http://cairographics.org/releases/cairo-${VERSION_CAIRO}.tar.xz | tar xJC ${DEPS}/cairo --strip-components=1
cd ${DEPS}/cairo
./configure --prefix=${TARGET} --enable-shared --disable-static --disable-dependency-tracking \
  --disable-xlib --disable-xcb --disable-quartz --disable-win32 --disable-egl --disable-glx --disable-wgl \
  --disable-script --disable-ps --disable-gobject --disable-trace --disable-interpreter \
  && make install-strip

mkdir ${DEPS}/pango
curl -Ls https://download.gnome.org/sources/pango/1.40/pango-${VERSION_PANGO}.tar.xz | tar xJC ${DEPS}/pango --strip-components=1
cd ${DEPS}/pango
./configure --prefix=${TARGET} --enable-shared --disable-static --disable-dependency-tracking && make install-strip

mkdir ${DEPS}/croco
curl -Ls https://download.gnome.org/sources/libcroco/0.6/libcroco-${VERSION_CROCO}.tar.xz | tar xJC ${DEPS}/croco --strip-components=1
cd ${DEPS}/croco
./configure --prefix=${TARGET} --enable-shared --disable-static --disable-dependency-tracking && make install-strip

mkdir ${DEPS}/svg
curl -Ls https://download.gnome.org/sources/librsvg/2.40/librsvg-${VERSION_SVG}.tar.xz | tar xJC ${DEPS}/svg --strip-components=1
cd ${DEPS}/svg
./configure --prefix=${TARGET} --enable-shared --disable-static --disable-dependency-tracking \
  --disable-introspection --disable-tools \
  && make install-strip

mkdir ${DEPS}/gif
curl -Ls http://${SOURCEFORGE_MIRROR}.dl.sourceforge.net/project/giflib/giflib-${VERSION_GIF}.tar.gz | tar xzC ${DEPS}/gif --strip-components=1
cd ${DEPS}/gif
./configure --prefix=${TARGET} --enable-shared --disable-static --disable-dependency-tracking && make install-strip

mkdir ${DEPS}/vips
curl -Ls http://www.vips.ecs.soton.ac.uk/supported/8.3/vips-${VERSION_VIPS}.tar.gz | tar xzC ${DEPS}/vips --strip-components=1
cd ${DEPS}/vips
./configure --prefix=${TARGET} --enable-shared --disable-static --disable-dependency-tracking \
  --disable-debug --disable-introspection --without-python --without-fftw \
  --without-magick --without-pangoft2 --without-ppm --without-analyze --without-radiance \
  --with-zip-includes=${TARGET}/include --with-zip-libraries=${TARGET}/lib \
  --with-jpeg-includes=${TARGET}/include --with-jpeg-libraries=${TARGET}/lib \
  && make install-strip

# Remove the old C++ bindings
cd ${TARGET}/include
rm -rf vips/vipsc++.h vips/vipscpp.h
cd ${TARGET}/lib
rm -rf pkgconfig .libs *.la libvipsCC*

# Create JSON file of version numbers
cd ${TARGET}
echo "{\n\
  \"cairo\": \"${VERSION_CAIRO}\",\n\
  \"croco\": \"${VERSION_CROCO}\",\n\
  \"exif\": \"${VERSION_EXIF}\",\n\
  \"ffi\": \"${VERSION_FFI}\",\n\
  \"fontconfig\": \"${VERSION_FONTCONFIG}\",\n\
  \"freetype\": \"${VERSION_FREETYPE}\",\n\
  \"gdkpixbuf\": \"${VERSION_GDKPIXBUF}\",\n\
  \"gif\": \"${VERSION_GIF}\",\n\
  \"glib\": \"${VERSION_GLIB}\",\n\
  \"gsf\": \"${VERSION_GSF}\",\n\
  \"harfbuzz\": \"${VERSION_HARFBUZZ}\",\n\
  \"jpeg\": \"${VERSION_JPEG}\",\n\
  \"lcms\": \"${VERSION_LCMS2}\",\n\
  \"orc\": \"${VERSION_ORC}\",\n\
  \"pango\": \"${VERSION_PANGO}\",\n\
  \"pixman\": \"${VERSION_PIXMAN}\",\n\
  \"png\": \"${VERSION_PNG16}\",\n\
  \"svg\": \"${VERSION_SVG}\",\n\
  \"tiff\": \"${VERSION_TIFF}\",\n\
  \"vips\": \"${VERSION_VIPS}\",\n\
  \"webp\": \"${VERSION_WEBP}\",\n\
  \"xml\": \"${VERSION_XML2}\",\n\
  \"zlib\": \"${VERSION_ZLIB}\"\n\
}" >lib/versions.json

# Create .tar.gz
GZIP=-9 tar czf /arm/libvips-${VERSION_VIPS}-arm.tar.gz include lib
