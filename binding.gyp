{
  'targets': [{
    'target_name': 'sharp',
    'sources': [
      'src/common.cc',
      'src/utilities.cc',
      'src/metadata.cc',
      'src/resize.cc',
      'src/sharp.cc'
    ],
    'variables': {
      'PKG_CONFIG_PATH': '<!(which brew >/dev/null 2>&1 && eval $(brew --env) && echo $PKG_CONFIG_LIBDIR || true):$PKG_CONFIG_PATH:/usr/local/lib/pkgconfig:/usr/lib/pkgconfig',
      'HAVE_OPENSLIDE': '<!(pkg-config --modversion openslide)'
    },
    'conditions': [
       ['HAVE_OPENSLIDE=="3.4.0"', {
         'defines': [ 'HAVE_OPENSLIDE_3_4' ]
       }]
    ],
    'libraries': [
      '<!(PKG_CONFIG_PATH="<(PKG_CONFIG_PATH)" pkg-config --libs vips openslide)'
    ],
    'include_dirs': [
      '<!(PKG_CONFIG_PATH="<(PKG_CONFIG_PATH)" pkg-config --cflags vips glib-2.0 openslide)',
      '<!(node -e "require(\'nan\')")'
    ],
    'cflags_cc': [
      '-std=c++0x',
      '-fexceptions',
      '-Wall',
      '-O3'
    ],
    'xcode_settings': {
      'OTHER_CPLUSPLUSFLAGS': [
        '-std=c++11',
        '-stdlib=libc++',
        '-fexceptions',
        '-Wall',
        '-O3'
      ],
      'MACOSX_DEPLOYMENT_TARGET': '10.7'
    }
  }]
}
