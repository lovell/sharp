{
  'targets': [{
    'target_name': 'libvips-cpp',
    'conditions': [
      ['OS == "win"', {
        # Build libvips C++ binding for Windows due to MSVC std library ABI changes
        'type': 'shared_library',
        'variables': {
          'download_vips': '<!(node -e "require(\'./binding\').download_vips()")'
        },
        'defines': [
          'VIPS_CPLUSPLUS_EXPORTS'
        ],
        'sources': [
          'src/libvips/cplusplus/VError.cpp',
          'src/libvips/cplusplus/VInterpolate.cpp',
          'src/libvips/cplusplus/VImage.cpp'
        ],
        'include_dirs': [
          '<(module_root_dir)/include',
          '<(module_root_dir)/include/glib-2.0',
          '<(module_root_dir)/lib/glib-2.0/include'
        ],
        'libraries': [
          '<(module_root_dir)/lib/libvips.lib',
          '<(module_root_dir)/lib/libglib-2.0.lib',
          '<(module_root_dir)/lib/libgobject-2.0.lib'
        ],
        'configurations': {
          'Release': {
            'msvs_settings': {
              'VCCLCompilerTool': {
                'ExceptionHandling': 1
              }
            },
            'msvs_disabled_warnings': [
              4275
            ]
          }
        }
      }, {
        # Ignore this target for non-Windows
        'type': 'none'
      }]
    ]
  }, {
    'target_name': 'sharp',
    'dependencies': [
      'libvips-cpp'
    ],
    # Nested variables "pattern" borrowed from http://src.chromium.org/viewvc/chrome/trunk/src/build/common.gypi
    'variables': {
      'variables': {
        'variables': {
          'conditions': [
            ['OS != "win"', {
              # Build the PKG_CONFIG_PATH environment variable with all possible combinations
              'pkg_config_path': '<!(which brew >/dev/null 2>&1 && eval $(brew --env) && echo $PKG_CONFIG_LIBDIR || true):$PKG_CONFIG_PATH:/usr/local/lib/pkgconfig:/usr/lib/pkgconfig'
            }, {
              'pkg_config_path': ''
            }]
          ],
        },
        'conditions': [
          ['OS != "win"', {
            # Which version, if any, of libvips is available globally via pkg-config?
            'global_vips_version': '<!(PKG_CONFIG_PATH="<(pkg_config_path)" pkg-config --modversion vips-cpp 2>/dev/null || true)'
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
          # Does the globally available version of libvips, if any, meet the minimum version requirement?
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
    'defines': [
      '_GLIBCXX_USE_CXX11_ABI=0'
    ],
    'include_dirs': [
      '<!(node -e "require(\'nan\')")'
    ],
    'conditions': [
      ['use_global_vips == "true"', {
        # Use pkg-config for include and lib
        'include_dirs': ['<!@(PKG_CONFIG_PATH="<(pkg_config_path)" pkg-config --cflags-only-I vips-cpp vips glib-2.0 | sed s\/-I//g)'],
        'conditions': [
          ['runtime_link == "static"', {
            'libraries': ['<!@(PKG_CONFIG_PATH="<(pkg_config_path)" pkg-config --libs --static vips-cpp)']
          }, {
            'libraries': ['<!@(PKG_CONFIG_PATH="<(pkg_config_path)" pkg-config --libs vips-cpp)']
          }]
        ]
      }, {
        # Attempt to download pre-built libvips and install locally within node_modules
        'include_dirs': [
          '<(module_root_dir)/include',
          '<(module_root_dir)/include/glib-2.0',
          '<(module_root_dir)/lib/glib-2.0/include'
        ],
        'conditions': [
          ['OS == "win"', {
            'libraries': [
              '<(module_root_dir)/lib/libvips.lib',
              '<(module_root_dir)/lib/libglib-2.0.lib',
              '<(module_root_dir)/lib/libgobject-2.0.lib'
            ]
          }],
          ['OS == "linux"', {
            'variables': {
              'download_vips': '<!(LDD_VERSION="<!(ldd --version 2>&1 || true)" node -e "require(\'./binding\').download_vips()")'
            },
            'libraries': [
              '<(module_root_dir)/lib/libvips-cpp.so',
              '<(module_root_dir)/lib/libvips.so',
              '<(module_root_dir)/lib/libglib-2.0.so',
              '<(module_root_dir)/lib/libgobject-2.0.so',
              # Dependencies of dependencies, included for openSUSE support
              '<(module_root_dir)/lib/libGraphicsMagick.so',
              '<(module_root_dir)/lib/libGraphicsMagickWand.so',
              '<(module_root_dir)/lib/libexif.so',
              '<(module_root_dir)/lib/libgio-2.0.so',
              '<(module_root_dir)/lib/libgmodule-2.0.so',
              '<(module_root_dir)/lib/libgsf-1.so',
              '<(module_root_dir)/lib/libjpeg.so',
              '<(module_root_dir)/lib/libpng.so',
              '<(module_root_dir)/lib/libtiff.so',
              '<(module_root_dir)/lib/libwebp.so',
              '<(module_root_dir)/lib/libz.so',
              '<(module_root_dir)/lib/libffi.so',
              '<(module_root_dir)/lib/libgthread-2.0.so',
              '<(module_root_dir)/lib/liblcms2.so',
              '<(module_root_dir)/lib/libpng16.so',
              '<(module_root_dir)/lib/libxml2.so',
              '<(module_root_dir)/lib/liborc-0.4.so',
              # Ensure runtime linking is relative to sharp.node
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
      'CLANG_CXX_LANGUAGE_STANDARD': 'c++11',
      'CLANG_CXX_LIBRARY': 'libc++',
      'MACOSX_DEPLOYMENT_TARGET': '10.7',
      'GCC_ENABLE_CPP_EXCEPTIONS': 'YES',
      'OTHER_CPLUSPLUSFLAGS': [
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
        },
        'msvs_disabled_warnings': [
          4275
        ]
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
        # Windows lacks support for rpath
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
            '<(module_root_dir)/lib/libpng16-16.dll',
            '<(module_root_dir)/lib/libquadmath-0.dll',
            '<(module_root_dir)/lib/libsqlite3-0.dll',
            '<(module_root_dir)/lib/libssp-0.dll',
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
