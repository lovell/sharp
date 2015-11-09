#!/bin/sh

# Install Node.js on Archlinux
pacman -Sy --noconfirm gcc make python2 nodejs npm
ln -s /usr/bin/python2 /usr/bin/python
