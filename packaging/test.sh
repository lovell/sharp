#!/bin/sh

# Verify docker is available
if ! type docker >/dev/null; then
  echo "Please install docker"
  exit 1
fi

test="npm run clean && NODE_ENV=development npm install --unsafe-perm && npm test && npm run clean"

# Debian 7
echo -n "Testing wheezy... "
if docker run -i -t --rm -v $PWD:/v nodesource/wheezy:0.12 sh -c "cd /v && ./packaging/test/debian.sh && ./preinstall.sh && $test" >/dev/null;
then echo "OK"
else echo "fail"
fi

# Debian 8
# Ubuntu 12.04, 14.04
for dist in jessie precise trusty; do
  echo -n "Testing $dist... "
  if docker run -i -t --rm -v $PWD:/v nodesource/$dist:0.12 sh -c "cd /v && ./packaging/test/debian.sh && $test" >/dev/null;
  then echo "OK"
  else echo "fail"
  fi
done

# Centos 6
echo -n "Testing centos6... "
if docker run -i -t --rm -v $PWD:/v nodesource/centos6:0.12 sh -c "cd /v && source ./packaging/test/centos6.sh && ./preinstall.sh && $test" >/dev/null;
then echo "OK"
else echo "fail"
fi

# Centos 7
# Fedora 20, 21

for dist in centos7 fedora20 fedora21; do
  echo -n "Testing $dist... "
  if docker run -i -t --rm -v $PWD:/v nodesource/$dist:0.12 sh -c "cd /v && $test" >/dev/null;
  then echo "OK"
  else echo "fail"
  fi
done

# openSUSE 13.2
echo -n "Testing opensuse... "
docker run -i -t --rm -v $PWD:/v opensuse:13.2 sh -c "cd /v && ./packaging/test/opensuse.sh && $test" >/dev/null;
then echo "OK"
else echo "fail"
fi

# Archlinux 2015.06.01
echo -n "Testing archlinux... "
docker run -i -t --rm -v $PWD:/v base/archlinux:2015.06.01 sh -c "cd /v && ./packaging/test/archlinux.sh && $test" >/dev/null;
then echo "OK"
else echo "fail"
fi
