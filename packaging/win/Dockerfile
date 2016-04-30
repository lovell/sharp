FROM ubuntu:precise
MAINTAINER Lovell Fuller <npm@lovell.info>

RUN apt-get update && apt-get install -y curl zip

ENV VERSION_VIPS=8.3.0

# Fetch and unzip
RUN mkdir /vips
WORKDIR /vips
RUN curl -L -O https://github.com/lovell/build-win64/releases/download/v${VERSION_VIPS}/vips-dev-w64-web-8.3.zip
RUN unzip vips-dev-w64-web-8.3.zip

# Clean and zip
WORKDIR /vips/vips-dev-8.3
RUN rm bin/libvipsCC-42.dll bin/libvips-cpp-42.dll bin/libgsf-win32-1-114.dll
RUN cp bin/*.dll lib/
RUN cp -r lib64/* lib/

# Patch VImage8.h for MSVC support, can be removed with libvips v8.3.1+
RUN curl -o include/vips/VImage8.h https://raw.githubusercontent.com/jcupitt/libvips/baa175c4c0f99201d436edd035d58bbb3471e489/cplusplus/include/vips/VImage8.h

RUN GZIP=-9 tar czf /libvips-${VERSION_VIPS}-win.tar.gz include lib/glib-2.0 lib/libvips.lib lib/libglib-2.0.lib lib/libgobject-2.0.lib lib/*.dll
