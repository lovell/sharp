#!/bin/sh

# Verify docker is available
if ! type docker >/dev/null; then
  echo "Please install docker"
  exit 1
fi

version_node=6.3.0

test="npm run clean; npm install --unsafe-perm; npm test"

# Debian 7, 8
# Ubuntu 14.04
for dist in wheezy jessie trusty; do
  echo "Testing $dist..."
  if docker run -i -t --rm -v $PWD:/v -e "NODE_ENV=development" nodesource/$dist:$version_node >packaging/$dist.log 2>&1 sh -c "cd /v; ./packaging/test/debian.sh; $test";
  then echo "$dist OK"
  else echo "$dist fail" && cat packaging/$dist.log
  fi
done

# Centos 7
echo "Testing centos7..."
if docker run -i -t --rm -v $PWD:/v -e "NODE_ENV=development" nodesource/centos7:$version_node >packaging/$dist.log 2>&1 sh -c "cd /v; $test";
then echo "centos7 OK"
else echo "centos7 fail" && cat packaging/$dist.log
fi

# Fedora 22
echo "Testing fedora22..."
if docker run -i -t --rm -v $PWD:/v -e "NODE_ENV=development" nodesource/fedora22:$version_node >packaging/$dist.log 2>&1 sh -c "cd /v; $test";
then echo "fedora22 OK"
else echo "fedora22 fail" && cat packaging/$dist.log
fi

# openSUSE 13.2
echo "Testing opensuse..."
if docker run -i -t --rm -v $PWD:/v opensuse:13.2 >packaging/opensuse.log 2>&1 /bin/sh -c "cd /v; ./packaging/test/opensuse.sh; $test";
then echo "opensuse OK"
else echo "opensuse fail" && cat packaging/opensuse.log
fi

# Archlinux 2015.06.01
echo "Testing archlinux..."
if docker run -i -t --rm -v $PWD:/v pritunl/archlinux:latest >packaging/archlinux.log 2>&1 sh -c "cd /v; ./packaging/test/archlinux.sh; $test";
then echo "archlinux OK"
else echo "archlinux fail" && cat packaging/archlinux.log
fi

# Alpine
echo "Testing alpine..."
if docker run -i -t --rm -v $PWD:/v -e "SHARP_TEST_WITHOUT_CACHE=0" alpine:edge >packaging/alpine.log 2>&1 sh -c "cd /v; ./packaging/test/alpine.sh; $test";
then echo "alpine OK"
else echo "alpine fail" && cat packaging/alpine.log
fi
