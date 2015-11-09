#!/bin/sh

# Install Node.js on openSUSE 13.2
zypper addrepo http://download.opensuse.org/repositories/devel:languages:nodejs/openSUSE_13.2/devel:languages:nodejs.repo
zypper --gpg-auto-import-keys refresh
zypper --non-interactive install gcc-c++ make nodejs-devel
npm install -g npm
