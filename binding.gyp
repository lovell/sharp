{
  'targets': [{
    'target_name': 'sharp',
    'variables': {
      'variables': {
        'variables': {
          'conditions': [
            ['OS != "win"', {
              'pkg_config_path': '<!(which brew >/dev/null 2>&1 && eval $(brew --env) && echo $PKG_CONFIG_LIBDIR || true):$PKG_CONFIG_PATH:/usr/local/lib/pkgconfig:/usr/lib/pkgconfig'
            }, {
              'pkg_config_path': ''
            }]
          ]
        },
        'conditions': [
          ['OS != "win"', {
            'global_vips_version': '<!(PKG_CONFIG_PATH="<(pkg_config_path)" which pkg-config >/dev/null 2>&1 && pkg-config --exists vips && pkg-config --modversion vips || true)'
          }, {
            'global_vips_version': ''
          }]
        ],
        'pkg_config_path%': '<(pkg_config_path)'
      },
      'pkg_config_path%': '<(pkg_config_path)',
      'runtime_link%': 'shared',
      'conditions': [
        ['OS != "win"', {
          'use_global_vips': '<!(GLOBAL_VIPS_VERSION="<(global_vips_version)" node -e "require(\'./binding\').use_global_vips()")'
        }, {
          'use_global_vips': ''
        }]
      ]
    },
    'sources': [
      'src/common.cc',
      'src/metadata.cc',
      'src/operations.cc',
      'src/pipeline.cc',
      'src/sharp.cc',
      'src/utilities.cc'
    ],
    'include_dirs': [
      '<!(node -e "require(\'nan\')")'
    ],
    'conditions': [
      ['use_global_vips == "true"', {
        'include_dirs': ['<!(PKG_CONFIG_PATH="<(pkg_config_path)" pkg-config --cflags vips glib-2.0)'],
        'conditions': [
          ['runtime_link == "static"', {
            'libraries': ['<!(PKG_CONFIG_PATH="<(pkg_config_path)" pkg-config --libs vips --static)']
          }, {
            'libraries': ['<!(PKG_CONFIG_PATH="<(pkg_config_path)" pkg-config --libs vips)']
          }]
        ]
      }, {
        'include_dirs': [
          '<(module_root_dir)/include',
          '<(module_root_dir)/include/glib-2.0',
          '<(module_root_dir)/lib/glib-2.0/include'
        ],
        'conditions': [
          ['OS == "win"', {
            'variables': {
              'download_vips': '<!(node -e "require(\'./binding\').download_vips()")'
            },
            'libraries': [
              '<(module_root_dir)/lib/libvips.lib',
              '<(module_root_dir)/lib/glib-2.0.lib',
              '<(module_root_dir)/lib/gobject-2.0.lib'
            ]
          }],
          ['OS == "linux"', {
            'variables': {
              'download_vips': '<!(LDD_VERSION="<!(ldd --version 2>&1 || true)" node -e "require(\'./binding\').download_vips()")'
            },
            'libraries': [
              '<(module_root_dir)/lib/libvips.so',
              '<(module_root_dir)/lib/libglib-2.0.so',
              '<(module_root_dir)/lib/libgobject-2.0.so',
              '-Wl,-rpath=\'$${ORIGIN}/../../lib\''
            ]
          }]
        ]
      }]
    ],
    'cflags_cc': [
      '-std=c++0x',
      '-fexceptions',
      '-Wall',
      '-O3'
    ],
    'xcode_settings': {
      'MACOSX_DEPLOYMENT_TARGET': '10.7',
      'OTHER_CPLUSPLUSFLAGS': [
        '-std=c++11',
        '-stdlib=libc++',
        '-fexceptions',
        '-Wall',
        '-O3'
      ]
    },
    'configurations': {
      'Release': {
        'msvs_settings': {
          'VCCLCompilerTool': {
            'ExceptionHandling': 1
          }
        }
      }
    },
  }, {
    'target_name': 'win_copy_dlls',
    'type': 'none',
    'dependencies': [
      'sharp'
    ],
    'conditions': [
      ['OS == "win"', {
        'copies': [{
          'destination': '<(module_root_dir)/build/Release',
          'files': [
            '<(module_root_dir)/lib/GNU.Gettext.dll',
            '<(module_root_dir)/lib/libMagickCore-6.Q16-2.dll',
            '<(module_root_dir)/lib/libMagickWand-6.Q16-2.dll',
            '<(module_root_dir)/lib/libasprintf-0.dll',
            '<(module_root_dir)/lib/libcairo-2.dll',
            '<(module_root_dir)/lib/libcairo-gobject-2.dll',
            '<(module_root_dir)/lib/libcairo-script-interpreter-2.dll',
            '<(module_root_dir)/lib/libexif-12.dll',
            '<(module_root_dir)/lib/libexpat-1.dll',
            '<(module_root_dir)/lib/libffi-6.dll',
            '<(module_root_dir)/lib/libfftw3-3.dll',
            '<(module_root_dir)/lib/libfontconfig-1.dll',
            '<(module_root_dir)/lib/libfreetype-6.dll',
            '<(module_root_dir)/lib/libgcc_s_seh-1.dll',
            '<(module_root_dir)/lib/libgdk_pixbuf-2.0-0.dll',
            '<(module_root_dir)/lib/libgio-2.0-0.dll',
            '<(module_root_dir)/lib/libglib-2.0-0.dll',
            '<(module_root_dir)/lib/libgmodule-2.0-0.dll',
            '<(module_root_dir)/lib/libgobject-2.0-0.dll',
            '<(module_root_dir)/lib/libgsf-1-114.dll',
            '<(module_root_dir)/lib/libgsf-win32-1-114.dll',
            '<(module_root_dir)/lib/libgthread-2.0-0.dll',
            '<(module_root_dir)/lib/libintl-8.dll',
            '<(module_root_dir)/lib/libjpeg-62.dll',
            '<(module_root_dir)/lib/liblcms2-2.dll',
            '<(module_root_dir)/lib/libopenjpeg-1.dll',
            '<(module_root_dir)/lib/libopenslide-0.dll',
            '<(module_root_dir)/lib/libpango-1.0-0.dll',
            '<(module_root_dir)/lib/libpangocairo-1.0-0.dll',
            '<(module_root_dir)/lib/libpangowin32-1.0-0.dll',
            '<(module_root_dir)/lib/libpixman-1-0.dll',
            '<(module_root_dir)/lib/libpng14-14.dll',
            '<(module_root_dir)/lib/libquadmath-0.dll',
            '<(module_root_dir)/lib/libsqlite3-0.dll',
            '<(module_root_dir)/lib/libssp-0.dll',
            '<(module_root_dir)/lib/libstdc++-6.dll',
            '<(module_root_dir)/lib/libtiff-5.dll',
            '<(module_root_dir)/lib/libvips-42.dll',
            '<(module_root_dir)/lib/libxml2-2.dll',
            '<(module_root_dir)/lib/zlib1.dll'
          ]
        }]
      }]
    ]
  }]
}
