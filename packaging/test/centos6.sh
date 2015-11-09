#!/bin/sh

# Install C++11 compatible version of g++ on Centos 6
curl -o /etc/yum.repos.d/devtools-1.1.repo http://people.centos.org/tru/devtools-1.1/devtools-1.1.repo
yum install -y devtoolset-1.1
export CC=/opt/centos/devtoolset-1.1/root/usr/bin/gcc
export CPP=/opt/centos/devtoolset-1.1/root/usr/bin/cpp
export CXX=/opt/centos/devtoolset-1.1/root/usr/bin/c++
