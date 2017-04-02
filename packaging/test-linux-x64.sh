#!/bin/sh

# Verify docker is available
if ! type docker >/dev/null; then
  echo "Please install docker"
  exit 1
fi

test="npm run clean; npm install --unsafe-perm; npm test"

# Debian 7, 8
# Ubuntu 14.04, 16.04
for dist in debian:jessie debian:stretch ubuntu:trusty ubuntu:xenial; do
  echo "Testing $dist..."
  docker pull $dist
  if docker run -i -t --rm -v $PWD:/v $dist >packaging/$dist.log 2>&1 sh -c "cd /v; ./packaging/test/debian.sh; $test";
  then echo "$dist OK"
  else echo "$dist fail" && cat packaging/$dist.log
  fi
done

# Centos 7
echo "Testing centos7..."
docker pull centos:7
if docker run -i -t --rm -v $PWD:/v centos:7 >packaging/centos7.log 2>&1 sh -c "cd /v; ./packaging/test/centos.sh; $test";
then echo "centos7 OK"
else echo "centos7 fail" && cat packaging/centos7.log
fi

# Archlinux latest
echo "Testing archlinux..."
docker pull pritunl/archlinux:latest
if docker run -i -t --rm -v $PWD:/v pritunl/archlinux:latest >packaging/archlinux.log 2>&1 sh -c "cd /v; ./packaging/test/archlinux.sh; $test";
then echo "archlinux OK"
else echo "archlinux fail" && cat packaging/archlinux.log
fi
