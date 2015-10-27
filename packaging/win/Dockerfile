FROM ubuntu:precise
MAINTAINER Lovell Fuller <npm@lovell.info>

RUN apt-get update && apt-get install -y curl zip

# Fetch and unzip
RUN mkdir /vips
WORKDIR /vips
RUN curl -O http://www.vips.ecs.soton.ac.uk/supported/8.1/win32/vips-dev-w64-8.1.1-2.zip
RUN unzip vips-dev-w64-8.1.1-2.zip

# Clean and zip
WORKDIR /vips/vips-dev-8.1.1
RUN rm bin/libvipsCC-42.dll bin/libvips-cpp-42.dll
RUN cp bin/*.dll lib/
RUN GZIP=-9 tar czf /libvips-8.1.1-win.tar.gz include lib/libvips.lib lib/libglib-2.0.lib lib/libgobject-2.0.lib lib/*.dll
