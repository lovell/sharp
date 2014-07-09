{
  'targets': [{
    'target_name': 'sharp',
    'sources': ['src/sharp.cc'],
    'variables': {
      'PKG_CONFIG_PATH': '<!(which brew >/dev/null 2>&1 && eval $(brew --env) && echo $PKG_CONFIG_LIBDIR || true):$PKG_CONFIG_PATH:/usr/local/lib/pkgconfig:/usr/lib/pkgconfig'
    },
    'libraries': [
      '<!(PKG_CONFIG_PATH="<(PKG_CONFIG_PATH)" pkg-config --libs vips)'
    ],
    'include_dirs': [
      '<!(PKG_CONFIG_PATH="<(PKG_CONFIG_PATH)" pkg-config --cflags vips glib-2.0)',
      '<!(node -e "require(\'nan\')")'
    ],
    'cflags': ['-fexceptions', '-Wall', '-O3'],
    'cflags_cc': ['-fexceptions', '-Wall', '-O3'],
    'xcode_settings': {
      'OTHER_CFLAGS': ['-fexceptions', '-Wall', '-O3']
    }
  }]
}
