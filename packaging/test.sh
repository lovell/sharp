#!/bin/sh

# Verify docker is available
if ! type docker >/dev/null; then
  echo "Please install docker"
  exit 1
fi

test="npm run clean; npm install --unsafe-perm; npm test"

# Debian 7, 8
# Ubuntu 12.04, 14.04
for dist in wheezy jessie precise trusty; do
  echo "Testing $dist..."
  if docker run -i -t --rm -v $PWD:/v -e "NODE_ENV=development" nodesource/$dist:0.12 >packaging/$dist.log 2>&1 sh -c "cd /v; ./packaging/test/debian.sh; $test";
  then echo "$dist OK"
  else echo "$dist fail" && cat packaging/$dist.log
  fi
done

# Centos 6
echo "Testing centos6..."
if docker run -i -t --rm -v $PWD:/v -e "NODE_ENV=development" nodesource/centos6:0.12 >packaging/centos6.log 2>&1 sh -c "cd /v; source ./packaging/test/centos6.sh; ./preinstall.sh; $test";
then echo "centos6 OK"
else echo "centos6 fail" && cat packaging/centos6.log
fi

# Centos 7
# Fedora 20, 21
for dist in centos7 fedora20 fedora21; do
  echo "Testing $dist..."
  if docker run -i -t --rm -v $PWD:/v -e "NODE_ENV=development" nodesource/$dist:0.12 >packaging/$dist.log 2>&1 sh -c "cd /v; $test";
  then echo "$dist OK"
  else echo "$dist fail" && cat packaging/$dist.log
  fi
done

# openSUSE 13.2
echo "Testing opensuse..."
if docker run -i -t --rm -v $PWD:/v opensuse:13.2 >packaging/opensuse.log 2>&1 /bin/sh -c "cd /v; ./packaging/test/opensuse.sh; $test";
then echo "opensuse OK"
else echo "opensuse fail" && cat packaging/opensuse.log
fi

# Archlinux 2015.06.01
echo "Testing archlinux..."
if docker run -i -t --rm -v $PWD:/v base/archlinux:2015.06.01 >packaging/archlinux.log 2>&1 sh -c "cd /v; ./packaging/test/archlinux.sh; $test";
then echo "archlinux OK"
else echo "archlinux fail" && cat packaging/archlinux.log
fi

# Alpine
echo "Testing alpine..."
if docker run -i -t --rm -v $PWD:/v -e "SHARP_TEST_WITHOUT_CACHE=0" alpine:edge >packaging/alpine.log 2>&1 sh -c "cd /v; ./packaging/test/alpine.sh; $test";
then echo "alpine OK"
else echo "alpine fail" && cat packaging/alpine.log
fi
