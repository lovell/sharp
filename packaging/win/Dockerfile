FROM ubuntu:precise
MAINTAINER Lovell Fuller <npm@lovell.info>

RUN apt-get update && apt-get install -y curl zip

ENV VERSION_VIPS=8.2.3

# Fetch and unzip
RUN mkdir /vips
WORKDIR /vips
RUN curl -O http://www.vips.ecs.soton.ac.uk/supported/8.2/win32/vips-dev-w64-8.2.zip
RUN unzip vips-dev-w64-8.2.zip

# Clean and zip
WORKDIR /vips/vips-dev-8.2
RUN rm bin/libvipsCC-42.dll bin/libvips-cpp-42.dll bin/libgsf-win32-1-114.dll bin/libstdc++-6.dll
RUN cp bin/*.dll lib/
RUN cp -r lib64/* lib/

RUN GZIP=-9 tar czf /libvips-${VERSION_VIPS}-win.tar.gz include lib/glib-2.0 lib/libvips.lib lib/libglib-2.0.lib lib/libgobject-2.0.lib lib/*.dll
