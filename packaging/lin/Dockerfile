FROM debian:wheezy
MAINTAINER Lovell Fuller <npm@lovell.info>

# Build dependencies
RUN apt-get update && apt-get install -y build-essential autoconf libtool nasm gtk-doc-tools texinfo

# Create working directories
ENV DEPS=/deps \
    TARGET=/target
RUN mkdir ${DEPS} && mkdir ${TARGET}

# Common build paths and flags
ENV PKG_CONFIG_PATH=${PKG_CONFIG_PATH}:${TARGET}/lib/pkgconfig \
    PATH=${PATH}:${TARGET}/bin \
    CPPFLAGS=-I${TARGET}/include \
    LDFLAGS=-L${TARGET}/lib \
    CFLAGS="-O3" \
    CXXFLAGS="-O3"

# Dependency version numbers
ENV VERSION_ZLIB=1.2.8 \
    VERSION_FFI=3.2.1 \
    VERSION_GLIB=2.47.5 \
    VERSION_XML2=2.9.3 \
    VERSION_GSF=1.14.34 \
    VERSION_EXIF=0.6.21 \
    VERSION_LCMS2=2.7 \
    VERSION_GM=1.3.23 \
    VERSION_JPEG=1.4.2 \
    VERSION_PNG16=1.6.21 \
    VERSION_WEBP=0.5.0 \
    VERSION_TIFF=4.0.6 \
    VERSION_ORC=0.4.24 \
    VERSION_VIPS=8.2.2

RUN mkdir ${DEPS}/zlib
RUN curl -Ls http://zlib.net/zlib-${VERSION_ZLIB}.tar.xz | tar xJC ${DEPS}/zlib --strip-components=1
WORKDIR ${DEPS}/zlib
RUN ./configure --prefix=${TARGET} && make install
RUN rm ${TARGET}/lib/libz.a

RUN mkdir ${DEPS}/ffi
RUN curl -Ls ftp://sourceware.org/pub/libffi/libffi-${VERSION_FFI}.tar.gz | tar xzC ${DEPS}/ffi --strip-components=1
WORKDIR ${DEPS}/ffi
RUN ./configure --prefix=${TARGET} --enable-shared --disable-static --disable-dependency-tracking --disable-builddir && make install-strip

RUN mkdir ${DEPS}/glib
RUN curl -Ls https://download.gnome.org/sources/glib/2.47/glib-${VERSION_GLIB}.tar.xz | tar xJC ${DEPS}/glib --strip-components=1
WORKDIR ${DEPS}/glib
RUN ./configure --prefix=${TARGET} --enable-shared --disable-static --disable-dependency-tracking --with-pcre=internal && make install-strip

RUN mkdir ${DEPS}/xml2
RUN curl -Ls http://xmlsoft.org/sources/libxml2-${VERSION_XML2}.tar.gz | tar xzC ${DEPS}/xml2 --strip-components=1
WORKDIR ${DEPS}/xml2
RUN ./configure --prefix=${TARGET} --enable-shared --disable-static --disable-dependency-tracking --without-python --with-zlib=${TARGET} && make install-strip

RUN mkdir ${DEPS}/gsf
RUN curl -Ls https://download.gnome.org/sources/libgsf/1.14/libgsf-${VERSION_GSF}.tar.xz | tar xJC ${DEPS}/gsf --strip-components=1
WORKDIR ${DEPS}/gsf
RUN ./configure --prefix=${TARGET} --enable-shared --disable-static --disable-dependency-tracking && make install-strip

RUN mkdir ${DEPS}/exif
RUN curl -Ls http://heanet.dl.sourceforge.net/project/libexif/libexif/${VERSION_EXIF}/libexif-${VERSION_EXIF}.tar.bz2 | tar xjC ${DEPS}/exif --strip-components=1
WORKDIR ${DEPS}/exif
RUN ./configure --prefix=${TARGET} --enable-shared --disable-static --disable-dependency-tracking && make install-strip

RUN mkdir ${DEPS}/lcms2
RUN curl -Ls http://heanet.dl.sourceforge.net/project/lcms/lcms/${VERSION_LCMS2}/lcms2-${VERSION_LCMS2}.tar.gz | tar xzC ${DEPS}/lcms2 --strip-components=1
WORKDIR ${DEPS}/lcms2
RUN ./configure --prefix=${TARGET} --enable-shared --disable-static --disable-dependency-tracking && make install-strip

RUN mkdir ${DEPS}/gm
RUN curl -Ls http://heanet.dl.sourceforge.net/project/graphicsmagick/graphicsmagick/${VERSION_GM}/GraphicsMagick-${VERSION_GM}.tar.xz | tar xJC ${DEPS}/gm --strip-components=1
WORKDIR ${DEPS}/gm
RUN ./configure --prefix=${TARGET} --enable-shared --disable-static --disable-dependency-tracking --without-magick-plus-plus && make install-strip

RUN mkdir ${DEPS}/jpeg
RUN curl -Ls http://heanet.dl.sourceforge.net/project/libjpeg-turbo/${VERSION_JPEG}/libjpeg-turbo-${VERSION_JPEG}.tar.gz | tar xzC ${DEPS}/jpeg --strip-components=1
WORKDIR ${DEPS}/jpeg
RUN ./configure --prefix=${TARGET} --enable-shared --disable-static --disable-dependency-tracking --with-jpeg8 --without-turbojpeg && make install-strip

RUN mkdir ${DEPS}/png16
RUN curl -Ls http://heanet.dl.sourceforge.net/project/libpng/libpng16/${VERSION_PNG16}/libpng-${VERSION_PNG16}.tar.xz | tar xJC ${DEPS}/png16 --strip-components=1
WORKDIR ${DEPS}/png16
RUN ./configure --prefix=${TARGET} --enable-shared --disable-static --disable-dependency-tracking && make install-strip

RUN mkdir ${DEPS}/webp
RUN curl -Ls http://downloads.webmproject.org/releases/webp/libwebp-${VERSION_WEBP}.tar.gz | tar xzC ${DEPS}/webp --strip-components=1
WORKDIR ${DEPS}/webp
RUN ./configure --prefix=${TARGET} --enable-shared --disable-static --disable-dependency-tracking && make install-strip

RUN mkdir ${DEPS}/tiff
RUN curl -Ls http://download.osgeo.org/libtiff/tiff-${VERSION_TIFF}.tar.gz | tar xzC ${DEPS}/tiff --strip-components=1
WORKDIR ${DEPS}/tiff
RUN ./configure --prefix=${TARGET} --enable-shared --disable-static --disable-dependency-tracking && make install-strip
RUN rm ${TARGET}/lib/libtiffxx*

RUN mkdir ${DEPS}/orc
RUN curl -Ls http://gstreamer.freedesktop.org/data/src/orc/orc-${VERSION_ORC}.tar.xz | tar xJC ${DEPS}/orc --strip-components=1
WORKDIR ${DEPS}/orc
RUN ./configure --prefix=${TARGET} --enable-shared --disable-static --disable-dependency-tracking && make install-strip

RUN mkdir ${DEPS}/vips
RUN curl -Ls http://www.vips.ecs.soton.ac.uk/supported/8.2/vips-${VERSION_VIPS}.tar.gz | tar xzC ${DEPS}/vips --strip-components=1
WORKDIR ${DEPS}/vips
RUN ./configure --prefix=${TARGET} --enable-shared --disable-static --disable-dependency-tracking \
  --disable-debug --disable-introspection --without-python --without-fftw --with-magickpackage=GraphicsMagick \
  --with-zip-includes=${TARGET}/include --with-zip-libraries=${TARGET}/lib \
  --with-jpeg-includes=${TARGET}/include --with-jpeg-libraries=${TARGET}/lib \
  && make install-strip

# Remove the old C++ bindings
WORKDIR ${TARGET}/include
RUN rm -rf vips/vipsc++.h vips/vipscpp.h
WORKDIR ${TARGET}/lib
RUN rm -rf pkgconfig .libs *.la libvipsCC*

# Create JSON file of version numbers
WORKDIR ${TARGET}
RUN echo "{\n\
  \"exif\": \"${VERSION_EXIF}\",\n\
  \"ffi\": \"${VERSION_FFI}\",\n\
  \"glib\": \"${VERSION_GLIB}\",\n\
  \"gsf\": \"${VERSION_GSF}\",\n\
  \"jpeg\": \"${VERSION_JPEG}\",\n\
  \"lcms\": \"${VERSION_LCMS2}\",\n\
  \"gm\": \"${VERSION_GM}\",\n\
  \"orc\": \"${VERSION_ORC}\",\n\
  \"png\": \"${VERSION_PNG16}\",\n\
  \"tiff\": \"${VERSION_TIFF}\",\n\
  \"vips\": \"${VERSION_VIPS}\"\n\
  \"webp\": \"${VERSION_WEBP}\",\n\
  \"xml\": \"${VERSION_XML2}\",\n\
  \"zlib\": \"${VERSION_ZLIB}\",\n\
}" >lib/versions.json

# Create .tar.gz
WORKDIR ${TARGET}
RUN GZIP=-9 tar czf /libvips-${VERSION_VIPS}-lin.tar.gz include lib
