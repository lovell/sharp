#!/bin/sh

# This script is no longer required on most
# 64-bit Linux systems when using sharp v0.12.0+

# See http://sharp.dimens.io/page/install#linux

# If you really need this script, it will attempt to
# globally install libvips if not already available.

# Supports:
# * Debian Linux
#   * Debian 7, 8
#   * Ubuntu 12.04, 14.04, 14.10, 15.04, 15.10
#   * Mint 13, 17
#   * Elementary 0.3
# * Red Hat Linux
#   * RHEL/Centos/Scientific 6, 7
#   * Fedora 21, 22, 23
#   * Amazon Linux 2015.03, 2015.09
# * OpenSuse 13

vips_version_minimum=8.2.2
vips_version_latest_major_minor=8.2
vips_version_latest_patch=2

openslide_version_minimum=3.4.0
openslide_version_latest_major_minor=3.4
openslide_version_latest_patch=1

install_libvips_from_source() {
  echo "Compiling libvips $vips_version_latest_major_minor.$vips_version_latest_patch from source"
  curl -O http://www.vips.ecs.soton.ac.uk/supported/$vips_version_latest_major_minor/vips-$vips_version_latest_major_minor.$vips_version_latest_patch.tar.gz
  tar zvxf vips-$vips_version_latest_major_minor.$vips_version_latest_patch.tar.gz
  cd vips-$vips_version_latest_major_minor.$vips_version_latest_patch
  ./configure --disable-debug --disable-docs --disable-static --disable-introspection --disable-dependency-tracking --enable-cxx=yes --without-python --without-orc --without-fftw $1
  make
  make install
  cd ..
  rm -rf vips-$vips_version_latest_major_minor.$vips_version_latest_patch
  rm vips-$vips_version_latest_major_minor.$vips_version_latest_patch.tar.gz
  ldconfig
  echo "Installed libvips $(PKG_CONFIG_PATH=$PKG_CONFIG_PATH:/usr/local/lib/pkgconfig:/usr/lib/pkgconfig pkg-config --modversion vips)"
}

install_libopenslide_from_source() {
  echo "Compiling openslide $openslide_version_latest_major_minor.$openslide_version_latest_patch from source"
  curl -O -L https://github.com/openslide/openslide/releases/download/v$openslide_version_latest_major_minor.$openslide_version_latest_patch/openslide-$openslide_version_latest_major_minor.$openslide_version_latest_patch.tar.gz
  tar xzvf openslide-$openslide_version_latest_major_minor.$openslide_version_latest_patch.tar.gz
  cd openslide-$openslide_version_latest_major_minor.$openslide_version_latest_patch
  PKG_CONFIG_PATH=$pkg_config_path ./configure $1
  make
  make install
  cd ..
  rm -rf openslide-$openslide_version_latest_major_minor.$openslide_version_latest_patch
  rm openslide-$openslide_version_latest_major_minor.$openslide_version_latest_patch.tar.gz
  ldconfig
  echo "Installed libopenslide $openslide_version_latest_major_minor.$openslide_version_latest_patch"
}

sorry() {
  echo "Sorry, I don't yet know how to install lib$1 on $2"
  exit 1
}

pkg_config_path="$PKG_CONFIG_PATH:/usr/local/lib/pkgconfig:/usr/lib/pkgconfig"

check_if_library_exists() {
  PKG_CONFIG_PATH=$pkg_config_path pkg-config --exists $1
  if [ $? -eq 0 ]; then
    version_found=$(PKG_CONFIG_PATH=$pkg_config_path pkg-config --modversion $1)
    PKG_CONFIG_PATH=$pkg_config_path pkg-config --atleast-version=$2 $1
    if [ $? -eq 0 ]; then
      # Found suitable version of libvips
      echo "Found lib$1 $version_found"
      return 1
    fi
    echo "Found lib$1 $version_found but require $2"
  else
    echo "Could not find lib$1 using a PKG_CONFIG_PATH of '$pkg_config_path'"
  fi
  return 0
}

enable_openslide=0
# Is libvips already installed, and is it at least the minimum required version?
if [ $# -eq 1 ]; then
  if [ "$1" = "--with-openslide" ]; then
    echo "Installing vips with openslide support"
    enable_openslide=1
  else
    echo "Sorry, $1 is not supported. Did you mean --with-openslide?"
    exit 1
  fi
fi

if ! type pkg-config >/dev/null; then
  sorry "vips" "a system without pkg-config"
fi

openslide_exists=0
if [ $enable_openslide -eq 1 ]; then
  check_if_library_exists "openslide" "$openslide_version_minimum"
  openslide_exists=$?
fi

check_if_library_exists "vips" "$vips_version_minimum"
vips_exists=$?
if [ $vips_exists -eq 1 ] && [ $enable_openslide -eq 1 ]; then
  if [ $openslide_exists -eq 1 ]; then
    # Check if vips compiled with openslide support
    vips_with_openslide=`vips list classes | grep -i opensli`
    if [ -z $vips_with_openslide ]; then
      echo "Vips compiled without openslide support."
    else
      exit 0
    fi
  fi
elif [ $vips_exists -eq 1 ] && [ $enable_openslide -eq 0 ]; then
  exit 0
fi

# Verify root/sudo access
if [ "$(id -u)" -ne "0" ]; then
  echo "Sorry, I need root/sudo access to continue"
  exit 1
fi

# Deprecation warning
if [ "$(arch)" == "x86_64" ]; then
  echo "This script is no longer required on most 64-bit Linux systems when using sharp v0.12.0+"
fi

# OS-specific installations of libopenslide follows
# Either openslide does not exist, or vips is installed without openslide support
if [ $enable_openslide -eq 1 ] && [ -z $vips_with_openslide ] && [ $openslide_exists -eq 0 ]; then
  if [ -f /etc/debian_version ]; then
    # Debian Linux
    DISTRO=$(lsb_release -c -s)
    echo "Detected Debian Linux '$DISTRO'"
    case "$DISTRO" in
      jessie|vivid|wily)
        # Debian 8, Ubuntu 15
        echo "Installing libopenslide via apt-get"
        apt-get install -y libopenslide-dev
        ;;
      trusty|utopic|qiana|rebecca|rafaela|freya)
        # Ubuntu 14, Mint 17
        echo "Installing libopenslide dependencies via apt-get"
        apt-get install -y automake build-essential curl zlib1g-dev libopenjpeg-dev libpng12-dev libjpeg-dev libtiff5-dev libgdk-pixbuf2.0-dev libxml2-dev libsqlite3-dev libcairo2-dev libglib2.0-dev sqlite3 libsqlite3-dev
        install_libopenslide_from_source
        ;;
      precise|wheezy|maya)
        # Debian 7, Ubuntu 12.04, Mint 13
        echo "Installing libopenslide dependencies via apt-get"
        apt-get install -y automake build-essential curl zlib1g-dev libopenjpeg-dev libpng12-dev libjpeg-dev libtiff5-dev libgdk-pixbuf2.0-dev libxml2-dev libsqlite3-dev libcairo2-dev libglib2.0-dev sqlite3 libsqlite3-dev
        install_libopenslide_from_source
        ;;
      *)
        # Unsupported Debian-based OS
        sorry "openslide" "Debian-based $DISTRO"
        ;;
    esac
  elif [ -f /etc/redhat-release ]; then
    # Red Hat Linux
    RELEASE=$(cat /etc/redhat-release)
    echo "Detected Red Hat Linux '$RELEASE'"
    case $RELEASE in
      "Red Hat Enterprise Linux release 7."*|"CentOS Linux release 7."*|"Scientific Linux release 7."*)
        # RHEL/CentOS 7
        echo "Installing libopenslide dependencies via yum"
        yum groupinstall -y "Development Tools"
        yum install -y tar curl libpng-devel libjpeg-devel libxml2-devel zlib-devel openjpeg-devel libtiff-devel gdk-pixbuf2-devel sqlite-devel cairo-devel glib2-devel
        install_libopenslide_from_source "--prefix=/usr"
        ;;
      "Red Hat Enterprise Linux release 6."*|"CentOS release 6."*|"Scientific Linux release 6."*)
        # RHEL/CentOS 6
        echo "Installing libopenslide dependencies via yum"
        yum groupinstall -y "Development Tools"
        yum install -y tar curl libpng-devel libjpeg-devel libxml2-devel zlib-devel openjpeg-devel libtiff-devel gdk-pixbuf2-devel sqlite-devel cairo-devel glib2-devel
        install_libopenslide_from_source "--prefix=/usr"
        ;;
      "Fedora release 21 "*|"Fedora release 22 "*)
        # Fedora 21, 22
        echo "Installing libopenslide via yum"
        yum install -y openslide-devel
        ;;
      *)
        # Unsupported RHEL-based OS
        sorry "openslide" "$RELEASE"
        ;;
    esac
  elif [ -f /etc/os-release ]; then
    RELEASE=$(cat /etc/os-release | grep VERSION)
    echo "Detected OpenSuse Linux '$RELEASE'"
    case $RELEASE in
      *"13.2"*)
      echo "Installing libopenslide via zypper"
      zypper --gpg-auto-import-keys install -y libopenslide-devel
      ;;
    esac
  elif [ -f /etc/SuSE-brand ]; then
    RELEASE=$(cat /etc/SuSE-brand | grep VERSION)
    echo "Detected OpenSuse Linux '$RELEASE'"
    case $RELEASE in
      *"13.1")
      echo "Installing libopenslide dependencies via zypper"
      zypper --gpg-auto-import-keys install -y --type pattern devel_basis
      zypper --gpg-auto-import-keys install -y tar curl libpng16-devel libjpeg-turbo libjpeg8-devel libxml2-devel zlib-devel openjpeg-devel libtiff-devel libgdk_pixbuf-2_0-0 sqlite3-devel cairo-devel glib2-devel
      install_libopenslide_from_source
      ;;
    esac
  else
    # Unsupported OS
    sorry "openslide" "$(uname -a)"
  fi
fi

# OS-specific installations of libvips follows

if [ -f /etc/debian_version ]; then
  # Debian Linux
  DISTRO=$(lsb_release -c -s)
  echo "Detected Debian Linux '$DISTRO'"
  case "$DISTRO" in
    jessie|trusty|utopic|vivid|wily|xenial|qiana|rebecca|rafaela|freya)
      # Debian 8, Ubuntu 14.04+, Mint 17
      echo "Installing libvips dependencies via apt-get"
      apt-get install -y automake build-essential gobject-introspection gtk-doc-tools libglib2.0-dev libjpeg-dev libpng12-dev libwebp-dev libtiff5-dev libexif-dev libgsf-1-dev liblcms2-dev libxml2-dev swig libmagickcore-dev curl
      install_libvips_from_source
      ;;
    precise|wheezy|maya)
      # Debian 7, Ubuntu 12.04, Mint 13
      echo "Installing libvips dependencies via apt-get"
      add-apt-repository -y ppa:lyrasis/precise-backports
      apt-get update
      apt-get install -y automake build-essential gobject-introspection gtk-doc-tools libglib2.0-dev libjpeg-dev libpng12-dev libwebp-dev libtiff4-dev libexif-dev libgsf-1-dev liblcms2-dev libxml2-dev swig libmagickcore-dev curl
      install_libvips_from_source
      ;;
    *)
      # Unsupported Debian-based OS
      sorry "vips" "Debian-based $DISTRO"
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
      yum install -y tar curl gtk-doc libxml2-devel libjpeg-turbo-devel libpng-devel libtiff-devel libexif-devel libgsf-devel lcms2-devel ImageMagick-devel gobject-introspection-devel libwebp-devel
      install_libvips_from_source "--prefix=/usr"
      ;;
    "Red Hat Enterprise Linux release 6."*|"CentOS release 6."*|"Scientific Linux release 6."*)
      # RHEL/CentOS 6
      echo "Installing libvips dependencies via yum"
      yum groupinstall -y "Development Tools"
      yum install -y tar curl gtk-doc libxml2-devel libjpeg-turbo-devel libpng-devel libtiff-devel libexif-devel libgsf-devel lcms-devel ImageMagick-devel
      yum install -y http://li.nux.ro/download/nux/dextop/el6/x86_64/nux-dextop-release-0-2.el6.nux.noarch.rpm
      yum install -y --enablerepo=nux-dextop gobject-introspection-devel
      yum install -y http://rpms.famillecollet.com/enterprise/remi-release-6.rpm
      yum install -y --enablerepo=remi libwebp-devel
      install_libvips_from_source "--prefix=/usr"
      ;;
    "Fedora"*)
      # Fedora 21, 22, 23
      echo "Installing libvips dependencies via yum"
      yum groupinstall -y "Development Tools"
      yum install -y gcc-c++ gtk-doc libxml2-devel libjpeg-turbo-devel libpng-devel libtiff-devel libexif-devel lcms-devel ImageMagick-devel gobject-introspection-devel libwebp-devel curl
      install_libvips_from_source "--prefix=/usr"
      ;;
    *)
      # Unsupported RHEL-based OS
      sorry "vips" "$RELEASE"
      ;;
  esac
elif [ -f /etc/system-release ]; then
  # Probably Amazon Linux
  RELEASE=$(cat /etc/system-release)
  case $RELEASE in
    "Amazon Linux AMI release 2015.03"|"Amazon Linux AMI release 2015.09")
      # Amazon Linux
      echo "Detected '$RELEASE'"
      echo "Installing libvips dependencies via yum"
      yum groupinstall -y "Development Tools"
      yum install -y gtk-doc libxml2-devel libjpeg-turbo-devel libpng-devel libtiff-devel libexif-devel libgsf-devel lcms2-devel ImageMagick-devel gobject-introspection-devel libwebp-devel curl
      install_libvips_from_source "--prefix=/usr"
      ;;
    *)
      # Unsupported Amazon Linux version
      sorry "vips" "$RELEASE"
      ;;
  esac
elif [ -f /etc/os-release ]; then
  RELEASE=$(cat /etc/os-release | grep VERSION)
  echo "Detected OpenSuse Linux '$RELEASE'"
  case $RELEASE in
    *"13.2"*)
    echo "Installing libvips dependencies via zypper"
    zypper --gpg-auto-import-keys install -y --type pattern devel_basis
    zypper --gpg-auto-import-keys install -y tar curl gtk-doc libxml2-devel libjpeg-turbo libjpeg8-devel libpng16-devel libtiff-devel libexif-devel liblcms2-devel ImageMagick-devel gobject-introspection-devel libwebp-devel
    install_libvips_from_source
    ;;
  esac
elif [ -f /etc/SuSE-brand ]; then
  RELEASE=$(cat /etc/SuSE-brand | grep VERSION)
  echo "Detected OpenSuse Linux '$RELEASE'"
  case $RELEASE in
    *"13.1")
    echo "Installing libvips dependencies via zypper"
    zypper --gpg-auto-import-keys install -y --type pattern devel_basis
    zypper --gpg-auto-import-keys install -y tar curl gtk-doc libxml2-devel libjpeg-turbo libjpeg8-devel libpng16-devel libtiff-devel libexif-devel liblcms2-devel ImageMagick-devel gobject-introspection-devel libwebp-devel
    install_libvips_from_source
    ;;
  esac
else
  # Unsupported OS
  sorry "vips" "$(uname -a)"
fi
