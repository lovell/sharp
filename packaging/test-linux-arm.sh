#!/bin/sh

if [ $# -lt 1 ]; then
  echo "Usage: $0 IP"
  echo "Test sharp on ARM using Docker, where IP is"
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

echo "Copying sharp source to device"
sshpass -e scp -o PreferredAuthentications=password -r ../../sharp pirate@${IP}:/home/pirate/sharp

echo "Compile and test within container"
sshpass -e ssh -o PreferredAuthentications=password -t pirate@${IP} "docker run --rm -v \${PWD}/sharp:/s hypriot/rpi-node:6 sh -c 'cd /s && npm install --unsafe-perm && npm test'"
