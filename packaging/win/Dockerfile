FROM ubuntu:precise
MAINTAINER Lovell Fuller <npm@lovell.info>

RUN apt-get update && apt-get install -y curl zip

# Fetch and unzip
RUN mkdir /vips
WORKDIR /vips
RUN curl -O http://www.vips.ecs.soton.ac.uk/supported/8.2/win32/vips-dev-w64-8.2.1.zip
RUN unzip vips-dev-w64-8.2.1.zip

# Clean and zip
WORKDIR /vips/vips-dev-8.2
RUN rm bin/libvipsCC-42.dll bin/libvips-cpp-42.dll bin/libgsf-win32-1-114.dll bin/libstdc++-6.dll
RUN cp bin/*.dll lib/
RUN cp -r lib64/* lib/

# Temporary workaround until libvips 8.2.2 is released
RUN curl -L -o include/vips/VError8.h https://raw.githubusercontent.com/jcupitt/libvips/master/cplusplus/include/vips/VError8.h
RUN curl -L -o include/vips/VImage8.h https://raw.githubusercontent.com/jcupitt/libvips/master/cplusplus/include/vips/VImage8.h
RUN curl -L -o include/vips/vips8 https://raw.githubusercontent.com/jcupitt/libvips/master/cplusplus/include/vips/vips8

RUN GZIP=-9 tar czf /libvips-8.2.1-win.tar.gz include lib/glib-2.0 lib/libvips.lib lib/libglib-2.0.lib lib/libgobject-2.0.lib lib/*.dll
