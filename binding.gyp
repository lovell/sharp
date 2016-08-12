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
          'VIPS_CPLUSPLUS_EXPORTS',
          '_ALLOW_KEYWORD_MACROS'
        ],
        'sources': [
          'src/libvips/cplusplus/VError.cpp',
          'src/libvips/cplusplus/VInterpolate.cpp',
          'src/libvips/cplusplus/VImage.cpp'
        ],
        'include_dirs': [
          'include',
          'include/glib-2.0',
          'lib/glib-2.0/include'
        ],
        'libraries': [
          '../lib/libvips.lib',
          '../lib/libglib-2.0.lib',
          '../lib/libgobject-2.0.lib'
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
      'sharp_cxx11%': '0',
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
      '_GLIBCXX_USE_CXX11_ABI=<(sharp_cxx11)',
      '_ALLOW_KEYWORD_MACROS'
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
          'include',
          'include/glib-2.0',
          'lib/glib-2.0/include'
        ],
        'conditions': [
          ['OS == "win"', {
            'libraries': [
              '../lib/libvips.lib',
              '../lib/libglib-2.0.lib',
              '../lib/libgobject-2.0.lib'
            ]
          }],
          ['OS == "mac"', {
            'variables': {
              'download_vips': '<!(node -e "require(\'./binding\').download_vips()")'
            },
            'libraries': [
              '../lib/libvips-cpp.42.dylib',
              '../lib/libvips.42.dylib',
              '../lib/libglib-2.0.0.dylib',
              '../lib/libgobject-2.0.0.dylib',
              # Ensure runtime linking is relative to sharp.node
              '-rpath \'@loader_path/../../lib\''
            ]
          }],
          ['OS == "linux"', {
            'variables': {
              'download_vips': '<!(LDD_VERSION="<!(ldd --version 2>&1 || true)" node -e "require(\'./binding\').download_vips()")'
            },
            'libraries': [
              '../lib/libvips-cpp.so',
              '../lib/libvips.so',
              '../lib/libglib-2.0.so',
              '../lib/libgobject-2.0.so',
              # Dependencies of dependencies, included for openSUSE support
              '../lib/libcairo.so',
              '../lib/libcroco-0.6.so',
              '../lib/libexif.so',
              '../lib/libffi.so',
              '../lib/libfontconfig.so',
              '../lib/libfreetype.so',
              '../lib/libgdk_pixbuf-2.0.so',
              '../lib/libgif.so',
              '../lib/libgio-2.0.so',
              '../lib/libgmodule-2.0.so',
              '../lib/libgsf-1.so',
              '../lib/libgthread-2.0.so',
              '../lib/libharfbuzz.so',
              '../lib/libjpeg.so',
              '../lib/liblcms2.so',
              '../lib/liborc-0.4.so',
              '../lib/libpango-1.0.so',
              '../lib/libpangocairo-1.0.so',
              '../lib/libpangoft2-1.0.so',
              '../lib/libpixman-1.so',
              '../lib/libpng.so',
              '../lib/librsvg-2.so',
              '../lib/libtiff.so',
              '../lib/libwebp.so',
              '../lib/libxml2.so',
              '../lib/libz.so',
              # Ensure runtime linking is relative to sharp.node
              '-Wl,--disable-new-dtags -Wl,-rpath=\'$${ORIGIN}/../../lib\''
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
      'GCC_ENABLE_CPP_RTTI': 'YES',
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
          'destination': 'build/Release',
          'files': [
            'lib/GNU.Gettext.dll',
            'lib/libasprintf-0.dll',
            'lib/libcairo-2.dll',
            'lib/libcairo-gobject-2.dll',
            'lib/libcairo-script-interpreter-2.dll',
            'lib/libcharset-1.dll',
            'lib/libcroco-0.6-3.dll',
            'lib/libexif-12.dll',
            'lib/libexpat-1.dll',
            'lib/libffi-6.dll',
            'lib/libfftw3-3.dll',
            'lib/libfontconfig-1.dll',
            'lib/libfreetype-6.dll',
            'lib/libgcc_s_seh-1.dll',
            'lib/libgdk_pixbuf-2.0-0.dll',
            'lib/libgif-7.dll',
            'lib/libgio-2.0-0.dll',
            'lib/libglib-2.0-0.dll',
            'lib/libgmodule-2.0-0.dll',
            'lib/libgobject-2.0-0.dll',
            'lib/libgsf-1-114.dll',
            'lib/libgthread-2.0-0.dll',
            'lib/libiconv-2.dll',
            'lib/libintl-8.dll',
            'lib/libjpeg-62.dll',
            'lib/liblcms2-2.dll',
            'lib/libpango-1.0-0.dll',
            'lib/libpangocairo-1.0-0.dll',
            'lib/libpangowin32-1.0-0.dll',
            'lib/libpixman-1-0.dll',
            'lib/libpng16-16.dll',
            'lib/libquadmath-0.dll',
            'lib/librsvg-2-2.dll',
            'lib/libssp-0.dll',
            'lib/libstdc++-6.dll',
            'lib/libtiff-5.dll',
            'lib/libvips-42.dll',
            'lib/libwebp-6.dll',
            'lib/libxml2-2.dll',
            'lib/zlib1.dll'
          ]
        }]
      }]
    ]
  }]
}
