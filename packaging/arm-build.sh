#!/bin/sh

if [ $# -lt 1 ]; then
  echo "Usage: $0 IP"
  echo "Build libvips for ARM using Docker, where IP is"
  echo "the address of a Raspberry Pi running HypriotOS"
  exit 1
fi
IP="$1"

echo "Verifying connectivity to $IP"
if ! ping -c 1 $IP; then
  echo "Could not connect to $IP"
  exit 1
fi

if ! type sshpass >/dev/null; then
  echo "Please install sshpass"
  exit 1
fi

export SSHPASS=hypriot

echo "Copying arm/Dockerfile and arm/build.sh to device"
sshpass -e scp -o PreferredAuthentications=password -r arm root@${IP}:/root

echo "Building Raspbian-based container"
sshpass -e ssh -o PreferredAuthentications=password -t root@${IP} "docker build -t vips-dev-arm arm"

echo "Running arm/build.sh within container"
sshpass -e ssh -o PreferredAuthentications=password -t root@${IP} "docker run -i -t --rm -v \${PWD}/arm:/arm vips-dev-arm sh -c 'cd /arm && ./build.sh' | tee arm/build.log"

echo "Copying resultant tar.gz file from device"
sshpass -e scp -o PreferredAuthentications=password root@${IP}:/root/arm/*.tar.gz .
