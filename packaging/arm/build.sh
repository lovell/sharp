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
VERSION_GLIB=2.46.2
VERSION_XML2=2.9.3
VERSION_GSF=1.14.34
VERSION_EXIF=0.6.21
VERSION_JPEG=1.4.2
VERSION_PNG16=1.6.21
VERSION_LCMS2=2.7
VERSION_WEBP=0.5.0
VERSION_TIFF=4.0.6
VERSION_MAGICK=6.9.3-2
VERSION_ORC=0.4.24
VERSION_VIPS=8.2.2

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
curl -Ls http://ftp.gnome.org/pub/gnome/sources/glib/2.46/glib-${VERSION_GLIB}.tar.xz | tar xJC ${DEPS}/glib --strip-components=1
cd ${DEPS}/glib
./configure --prefix=${TARGET} --enable-shared --disable-static --disable-dependency-tracking && make install-strip

mkdir ${DEPS}/xml2
curl -Ls http://xmlsoft.org/sources/libxml2-${VERSION_XML2}.tar.gz | tar xzC ${DEPS}/xml2 --strip-components=1
cd ${DEPS}/xml2
./configure --prefix=${TARGET} --enable-shared --disable-static --disable-dependency-tracking --without-python --with-zlib=${TARGET} && make install-strip

mkdir ${DEPS}/gsf
curl -Ls http://ftp.gnome.org/pub/GNOME/sources/libgsf/1.14/libgsf-${VERSION_GSF}.tar.xz | tar xJC ${DEPS}/gsf --strip-components=1
cd ${DEPS}/gsf
./configure --prefix=${TARGET} --enable-shared --disable-static --disable-dependency-tracking && make install-strip

mkdir ${DEPS}/exif
curl -Ls http://heanet.dl.sourceforge.net/project/libexif/libexif/${VERSION_EXIF}/libexif-${VERSION_EXIF}.tar.bz2 | tar xjC ${DEPS}/exif --strip-components=1
cd ${DEPS}/exif
./configure --prefix=${TARGET} --enable-shared --disable-static --disable-dependency-tracking && make install-strip

mkdir ${DEPS}/jpeg
curl -Ls http://heanet.dl.sourceforge.net/project/libjpeg-turbo/${VERSION_JPEG}/libjpeg-turbo-${VERSION_JPEG}.tar.gz | tar xzC ${DEPS}/jpeg --strip-components=1
cd ${DEPS}/jpeg
./configure --prefix=${TARGET} --enable-shared --disable-static --disable-dependency-tracking --with-jpeg8 --without-turbojpeg && make install-strip

mkdir ${DEPS}/png16
curl -Ls http://heanet.dl.sourceforge.net/project/libpng/libpng16/${VERSION_PNG16}/libpng-${VERSION_PNG16}.tar.xz | tar xJC ${DEPS}/png16 --strip-components=1
cd ${DEPS}/png16
./configure --prefix=${TARGET} --enable-shared --disable-static --disable-dependency-tracking && make install-strip

mkdir ${DEPS}/lcms2
curl -Ls http://heanet.dl.sourceforge.net/project/lcms/lcms/${VERSION_LCMS2}/lcms2-${VERSION_LCMS2}.tar.gz | tar xzC ${DEPS}/lcms2 --strip-components=1
cd ${DEPS}/lcms2
./configure --prefix=${TARGET} --enable-shared --disable-static --disable-dependency-tracking && make install-strip

mkdir ${DEPS}/webp
curl -Ls http://downloads.webmproject.org/releases/webp/libwebp-${VERSION_WEBP}.tar.gz | tar xzC ${DEPS}/webp --strip-components=1
cd ${DEPS}/webp
./configure --prefix=${TARGET} --enable-shared --disable-static --disable-dependency-tracking && make install-strip

mkdir ${DEPS}/tiff
curl -Ls http://download.osgeo.org/libtiff/tiff-${VERSION_TIFF}.tar.gz /deps/tiff.tar.gz | tar xzC ${DEPS}/tiff --strip-components=1
cd ${DEPS}/tiff
./configure --prefix=${TARGET} --enable-shared --disable-static --disable-dependency-tracking && make install-strip
rm ${TARGET}/lib/libtiffxx*

mkdir ${DEPS}/magick
curl -Ls http://www.imagemagick.org/download/releases/ImageMagick-${VERSION_MAGICK}.tar.xz | tar xJC ${DEPS}/magick --strip-components=1
cd ${DEPS}/magick
./configure --prefix=${TARGET} --enable-shared --disable-static --disable-dependency-tracking --without-magick-plus-plus && make install-strip

mkdir ${DEPS}/orc
curl -Ls http://gstreamer.freedesktop.org/data/src/orc/orc-${VERSION_ORC}.tar.xz | tar xJC ${DEPS}/orc --strip-components=1
cd ${DEPS}/orc
./configure --prefix=${TARGET} --enable-shared --disable-static --disable-dependency-tracking && make install-strip

mkdir ${DEPS}/vips
curl -Ls http://www.vips.ecs.soton.ac.uk/supported/8.2/vips-${VERSION_VIPS}.tar.gz | tar xzC ${DEPS}/vips --strip-components=1
cd ${DEPS}/vips
./configure --prefix=${TARGET} --enable-shared --disable-static --disable-dependency-tracking \
  --disable-debug --disable-introspection --without-python --without-fftw \
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
  \"zlib\": \"${VERSION_ZLIB}\",\n\
  \"ffi\": \"${VERSION_FFI}\",\n\
  \"glib\": \"${VERSION_GLIB}\",\n\
  \"xml\": \"${VERSION_XML2}\",\n\
  \"gsf\": \"${VERSION_GSF}\",\n\
  \"exif\": \"${VERSION_EXIF}\",\n\
  \"jpeg\": \"${VERSION_JPEG}\",\n\
  \"png\": \"${VERSION_PNG16}\",\n\
  \"lcms\": \"${VERSION_LCMS2}\",\n\
  \"webp\": \"${VERSION_WEBP}\",\n\
  \"tiff\": \"${VERSION_TIFF}\",\n\
  \"magick\": \"${VERSION_MAGICK}\",\n\
  \"orc\": \"${VERSION_ORC}\",\n\
  \"vips\": \"${VERSION_VIPS}\"\n\
}" >lib/versions.json

# Create .tar.gz
GZIP=-9 tar czf /arm/libvips-${VERSION_VIPS}-arm.tar.gz include lib
