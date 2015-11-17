FROM debian:wheezy
MAINTAINER Lovell Fuller <npm@lovell.info>

RUN apt-get update && apt-get install -y build-essential autoconf libtool nasm gtk-doc-tools texinfo

ENV DEPS /deps
ENV TARGET /target
RUN mkdir ${DEPS} && mkdir ${TARGET}

ENV PKG_CONFIG_PATH ${PKG_CONFIG_PATH}:${TARGET}/lib/pkgconfig
ENV PATH ${PATH}:${TARGET}/bin

ENV CPPFLAGS -I${TARGET}/include
ENV LDFLAGS -L${TARGET}/lib
ENV MAKEFLAGS -j2

RUN mkdir ${DEPS}/zlib
RUN curl -Ls http://zlib.net/zlib-1.2.8.tar.xz | tar xJC ${DEPS}/zlib --strip-components=1
WORKDIR ${DEPS}/zlib
RUN ./configure --prefix=${TARGET} && make install
RUN rm ${TARGET}/lib/libz.a

RUN mkdir ${DEPS}/ffi
RUN curl -Ls ftp://sourceware.org/pub/libffi/libffi-3.2.1.tar.gz | tar xzC ${DEPS}/ffi --strip-components=1
WORKDIR ${DEPS}/ffi
RUN ./configure --prefix=${TARGET} --enable-shared --disable-static --disable-dependency-tracking --disable-builddir && make install-strip

RUN mkdir ${DEPS}/glib
RUN curl -Ls http://ftp.gnome.org/pub/gnome/sources/glib/2.46/glib-2.46.2.tar.xz | tar xJC ${DEPS}/glib --strip-components=1
WORKDIR ${DEPS}/glib
RUN ./configure --prefix=${TARGET} --enable-shared --disable-static --disable-dependency-tracking && make install-strip

RUN mkdir ${DEPS}/xml2
RUN curl -Ls http://xmlsoft.org/sources/libxml2-2.9.2.tar.gz | tar xzC ${DEPS}/xml2 --strip-components=1
WORKDIR ${DEPS}/xml2
RUN ./configure --prefix=${TARGET} --enable-shared --disable-static --disable-dependency-tracking --without-python --with-zlib=${TARGET} && make install-strip

RUN mkdir ${DEPS}/gsf
RUN curl -Ls http://ftp.gnome.org/pub/GNOME/sources/libgsf/1.14/libgsf-1.14.34.tar.xz | tar xJC ${DEPS}/gsf --strip-components=1
WORKDIR ${DEPS}/gsf
RUN ./configure --prefix=${TARGET} --enable-shared --disable-static --disable-dependency-tracking && make install-strip

RUN mkdir ${DEPS}/exif
RUN curl -Ls http://kent.dl.sourceforge.net/project/libexif/libexif/0.6.21/libexif-0.6.21.tar.bz2 | tar xjC ${DEPS}/exif --strip-components=1
WORKDIR ${DEPS}/exif
RUN ./configure --prefix=${TARGET} --enable-shared --disable-static --disable-dependency-tracking && make install-strip

RUN mkdir ${DEPS}/jpeg
RUN curl -Ls http://kent.dl.sourceforge.net/project/libjpeg-turbo/1.4.2/libjpeg-turbo-1.4.2.tar.gz | tar xzC ${DEPS}/jpeg --strip-components=1
WORKDIR ${DEPS}/jpeg
RUN ./configure --prefix=${TARGET} --enable-shared --disable-static --disable-dependency-tracking --with-jpeg8 --without-turbojpeg && make install-strip

RUN mkdir ${DEPS}/png
RUN curl -Ls http://kent.dl.sourceforge.net/project/libpng/libpng16/1.6.19/libpng-1.6.19.tar.xz | tar xJC ${DEPS}/png --strip-components=1
WORKDIR ${DEPS}/png
RUN ./configure --prefix=${TARGET} --enable-shared --disable-static --disable-dependency-tracking && make install-strip

RUN mkdir ${DEPS}/lcms2
RUN curl -Ls http://kent.dl.sourceforge.net/project/lcms/lcms/2.7/lcms2-2.7.tar.gz | tar xzC ${DEPS}/lcms2 --strip-components=1
WORKDIR ${DEPS}/lcms2
RUN ./configure --prefix=${TARGET} --enable-shared --disable-static --disable-dependency-tracking && make install-strip

RUN mkdir ${DEPS}/webp
RUN curl -Ls http://downloads.webmproject.org/releases/webp/libwebp-0.4.4.tar.gz | tar xzC ${DEPS}/webp --strip-components=1
WORKDIR ${DEPS}/webp
RUN ./configure --prefix=${TARGET} --enable-shared --disable-static --disable-dependency-tracking && make install-strip

RUN mkdir ${DEPS}/tiff
RUN curl -Ls http://download.osgeo.org/libtiff/tiff-4.0.6.tar.gz /deps/tiff.tar.gz | tar xzC ${DEPS}/tiff --strip-components=1
WORKDIR ${DEPS}/tiff
RUN ./configure --prefix=${TARGET} --enable-shared --disable-static --disable-dependency-tracking && make install-strip
RUN rm ${TARGET}/lib/libtiffxx*

RUN mkdir ${DEPS}/magick
RUN curl -Ls http://www.imagemagick.org/download/releases/ImageMagick-6.9.2-6.tar.xz | tar xJC ${DEPS}/magick --strip-components=1
WORKDIR ${DEPS}/magick
RUN ./configure --prefix=${TARGET} --enable-shared --disable-static --disable-dependency-tracking --without-magick-plus-plus && make install-strip

RUN mkdir ${DEPS}/orc
RUN curl -Ls http://gstreamer.freedesktop.org/data/src/orc/orc-0.4.24.tar.xz | tar xJC ${DEPS}/orc --strip-components=1
WORKDIR ${DEPS}/orc
RUN ./configure --prefix=${TARGET} --enable-shared --disable-static --disable-dependency-tracking && make install-strip

RUN mkdir ${DEPS}/vips
RUN curl -Ls http://www.vips.ecs.soton.ac.uk/supported/8.1/vips-8.1.1.tar.gz | tar xzC ${DEPS}/vips --strip-components=1
WORKDIR ${DEPS}/vips
RUN ./configure --prefix=${TARGET} --enable-shared --disable-static --disable-dependency-tracking \
  --disable-debug --disable-introspection --without-python --without-fftw \
  --with-zip-includes=${TARGET}/include --with-zip-libraries=${TARGET}/lib \
  --with-jpeg-includes=${TARGET}/include --with-jpeg-libraries=${TARGET}/lib \
  && make install-strip
# Remove the C++ bindings
RUN rm ${TARGET}/lib/*.la
RUN rm ${TARGET}/lib/libvipsCC*
RUN rm ${TARGET}/lib/libvips-cpp.*
RUN rm ${TARGET}/include/vips/vipsc++.h
RUN rm ${TARGET}/include/vips/vipscpp.h
RUN rm ${TARGET}/include/vips/V*.h

WORKDIR ${TARGET}/lib
RUN rm -rf pkgconfig .libs

WORKDIR ${TARGET}
RUN GZIP=-9 tar czf /libvips-8.1.1-lin.tar.gz include lib
