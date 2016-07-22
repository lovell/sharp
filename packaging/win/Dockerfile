FROM debian:wheezy
MAINTAINER Lovell Fuller <npm@lovell.info>

RUN apt-get update && apt-get install -y curl zip advancecomp

ENV VERSION_VIPS=8.3.1

# Fetch and unzip
RUN mkdir /vips
WORKDIR /vips
RUN curl -L -O https://github.com/lovell/build-win64/releases/download/v${VERSION_VIPS}/vips-dev-w64-web-${VERSION_VIPS}.zip
RUN unzip vips-dev-w64-web-${VERSION_VIPS}.zip

# Clean and zip
WORKDIR /vips/vips-dev-8.3
RUN rm bin/libvipsCC-42.dll bin/libvips-cpp-42.dll bin/libgsf-win32-1-114.dll
RUN cp bin/*.dll lib/
RUN cp -r lib64/* lib/

RUN tar czf /libvips-${VERSION_VIPS}-win.tar.gz include lib/glib-2.0 lib/libvips.lib lib/libglib-2.0.lib lib/libgobject-2.0.lib lib/*.dll
RUN advdef --recompress --shrink-insane /libvips-${VERSION_VIPS}-win.tar.gz
