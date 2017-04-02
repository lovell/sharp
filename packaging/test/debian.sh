#!/bin/sh

apt-get update
apt-get install -y build-essential python pkg-config curl
curl -sL https://deb.nodesource.com/setup_6.x | bash -
apt-get install -y nodejs
