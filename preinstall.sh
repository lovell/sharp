#!/bin/sh

# Ensures libvips is installed and attempts to install it if not
# Currently supports:
# * Mac OS
# * Debian Linux
#   * Debian 7, 8
#   * Ubuntu 12.04, 14.04, 14.10, 15.04
#   * Mint 13, 17
# * Red Hat Linux
#   * RHEL/Centos/Scientific 6, 7
#   * Fedora 21, 22
#   * Amazon Linux 2014.09

vips_version_minimum=7.40.0
vips_version_latest_major_minor=7.42
vips_version_latest_patch=3

install_libvips_from_source() {
  echo "Compiling libvips $vips_version_latest_major_minor.$vips_version_latest_patch from source"
  curl -O http://www.vips.ecs.soton.ac.uk/supported/$vips_version_latest_major_minor/vips-$vips_version_latest_major_minor.$vips_version_latest_patch.tar.gz
  tar zvxf vips-$vips_version_latest_major_minor.$vips_version_latest_patch.tar.gz
  cd vips-$vips_version_latest_major_minor.$vips_version_latest_patch
  ./configure --enable-debug=no --enable-docs=no --enable-cxx=yes --without-python --without-orc --without-fftw $1
  make
  make install
  cd ..
  rm -rf vips-$vips_version_latest_major_minor.$vips_version_latest_patch
  rm vips-$vips_version_latest_major_minor.$vips_version_latest_patch.tar.gz
  ldconfig
  echo "Installed libvips $vips_version_latest_major_minor.$vips_version_latest_patch"
}

sorry() {
  echo "Sorry, I don't yet know how to install libvips on $1"
  exit 1
}

# Is libvips already installed, and is it at least the minimum required version?

if ! type pkg-config >/dev/null; then
  sorry "a system without pkg-config"
fi

pkg_config_path_homebrew=`which brew >/dev/null 2>&1 && eval $(brew --env) && echo $PKG_CONFIG_LIBDIR || true`
pkg_config_path="$pkg_config_path_homebrew:$PKG_CONFIG_PATH:/usr/local/lib/pkgconfig:/usr/lib/pkgconfig"

PKG_CONFIG_PATH=$pkg_config_path pkg-config --exists vips
if [ $? -eq 0 ]; then
  vips_version_found=$(PKG_CONFIG_PATH=$pkg_config_path pkg-config --modversion vips)
  pkg-config --atleast-version=$vips_version_minimum vips
  if [ $? -eq 0 ]; then
    # Found suitable version of libvips
    echo "Found libvips $vips_version_found"
    exit 0
  fi
  echo "Found libvips $vips_version_found but require $vips_version_minimum"
else
  echo "Could not find libvips using a PKG_CONFIG_PATH of '$pkg_config_path'"
fi

# Verify root/sudo access
if [ "$(id -u)" -ne "0" ]; then
  echo "Sorry, I need root/sudo access to continue"
  exit 1
fi

# OS-specific installations of libvips follows

case $(uname -s) in
  *[Dd]arwin*)
    # Mac OS
    echo "Detected Mac OS"
    if type "brew" > /dev/null; then
      echo "Installing libvips via homebrew"
      brew install homebrew/science/vips --with-webp --with-graphicsmagick
    elif type "port" > /dev/null; then
      echo "Installing libvips via MacPorts"
      port install vips
    else
      sorry "Mac OS without homebrew or MacPorts"
    fi
    ;;
  *)
    if [ -f /etc/debian_version ]; then
      # Debian Linux
      DISTRO=$(lsb_release -c -s)
      echo "Detected Debian Linux '$DISTRO'"
      case "$DISTRO" in
        jessie|vivid)
          # Debian 8, Ubuntu 15
          echo "Installing libvips via apt-get"
          apt-get install -y libvips-dev libgsf-1-dev
          ;;
        trusty|utopic|qiana|rebecca)
          # Ubuntu 14, Mint 17
          echo "Installing libvips dependencies via apt-get"
          apt-get install -y automake build-essential gobject-introspection gtk-doc-tools libglib2.0-dev libjpeg-turbo8-dev libpng12-dev libwebp-dev libtiff5-dev libexif-dev libgsf-1-dev liblcms2-dev libxml2-dev swig libmagickcore-dev curl
          install_libvips_from_source
          ;;
        precise|wheezy|maya)
          # Debian 7, Ubuntu 12.04, Mint 13
          echo "Installing libvips dependencies via apt-get"
          add-apt-repository -y ppa:lyrasis/precise-backports
          apt-get update
          apt-get install -y automake build-essential gobject-introspection gtk-doc-tools libglib2.0-dev libjpeg-turbo8-dev libpng12-dev libwebp-dev libtiff4-dev libexif-dev libgsf-1-dev liblcms2-dev libxml2-dev swig libmagickcore-dev curl
          install_libvips_from_source
          ;;
        *)
          # Unsupported Debian-based OS
          sorry "Debian-based $DISTRO"
          ;;
      esac
    elif [ -f /etc/redhat-release ]; then
      # Red Hat Linux
      RELEASE=$(cat /etc/redhat-release)
      echo "Detected Red Hat Linux '$RELEASE'"
      case $RELEASE in
        "Red Hat Enterprise Linux release 7."*|"CentOS Linux release 7."*|"Scientific Linux release 7."*)
          # RHEL/CentOS 7
          echo "Installing libvips dependencies via yum"
          yum groupinstall -y "Development Tools"
          yum install -y gtk-doc libxml2-devel libjpeg-turbo-devel libpng-devel libtiff-devel libexif-devel libgsf-devel lcms-devel ImageMagick-devel gobject-introspection-devel libwebp-devel curl
          install_libvips_from_source "--prefix=/usr"
          ;;
        "Red Hat Enterprise Linux release 6."*|"CentOS release 6."*|"Scientific Linux release 6."*)
          # RHEL/CentOS 6
          echo "Installing libvips dependencies via yum"
          yum groupinstall -y "Development Tools"
          yum install -y gtk-doc libxml2-devel libjpeg-turbo-devel libpng-devel libtiff-devel libexif-devel libgsf-devel lcms-devel ImageMagick-devel curl
          yum install -y http://li.nux.ro/download/nux/dextop/el6/x86_64/nux-dextop-release-0-2.el6.nux.noarch.rpm
          yum install -y --enablerepo=nux-dextop gobject-introspection-devel
          yum install -y http://rpms.famillecollet.com/enterprise/remi-release-6.rpm
          yum install -y --enablerepo=remi libwebp-devel
          install_libvips_from_source "--prefix=/usr"
          ;;
        "Fedora release 21 "*|"Fedora release 22 "*)
          # Fedora 21, 22
          echo "Installing libvips via yum"
          yum install -y vips-devel
          ;;
        *)
          # Unsupported RHEL-based OS
          sorry "$RELEASE"
          ;;
      esac
    elif [ -f /etc/system-release ]; then
      # Probably Amazon Linux
      RELEASE=$(cat /etc/system-release)
      case $RELEASE in
        "Amazon Linux AMI release 2014.09")
          # Amazon Linux
          echo "Detected '$RELEASE'"
          echo "Installing libvips dependencies via yum"
          yum groupinstall -y "Development Tools"
          yum install -y gtk-doc libxml2-devel libjpeg-turbo-devel libpng-devel libtiff-devel libexif-devel libgsf-devel lcms-devel ImageMagick-devel gobject-introspection-devel libwebp-devel curl
          install_libvips_from_source "--prefix=/usr"
          ;;
      esac
    else
      # Unsupported OS
      sorry "$(uname -a)"
    fi
    ;;
esac
