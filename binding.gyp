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
          'vendor/include',
          'vendor/include/glib-2.0',
          'vendor/lib/glib-2.0/include'
        ],
        'libraries': [
          '../vendor/lib/libvips.lib',
          '../vendor/lib/libglib-2.0.lib',
          '../vendor/lib/libgobject-2.0.lib'
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
          }],
          ['OS == "linux"', {
            'defines': [
              # Inspect libvips-cpp.so to determine which C++11 ABI version was used and set _GLIBCXX_USE_CXX11_ABI accordingly. This is quite horrible.
              '_GLIBCXX_USE_CXX11_ABI=<!(if readelf -Ws "$(PKG_CONFIG_PATH="<(pkg_config_path)" pkg-config --variable libdir vips-cpp)/libvips-cpp.so" | c++filt | grep -qF __cxx11;then echo "1";else echo "0";fi)'
            ]
          }]
        ]
      }, {
        # Attempt to download pre-built libvips and install locally within node_modules
        'include_dirs': [
          'vendor/include',
          'vendor/include/glib-2.0',
          'vendor/lib/glib-2.0/include'
        ],
        'conditions': [
          ['OS == "win"', {
            'defines': [
              '_ALLOW_KEYWORD_MACROS'
            ],
            'libraries': [
              '../vendor/lib/libvips.lib',
              '../vendor/lib/libglib-2.0.lib',
              '../vendor/lib/libgobject-2.0.lib'
            ]
          }],
          ['OS == "mac"', {
            'variables': {
              'download_vips': '<!(node -e "require(\'./binding\').download_vips()")'
            },
            'libraries': [
              '../vendor/lib/libvips-cpp.42.dylib',
              '../vendor/lib/libvips.42.dylib',
              '../vendor/lib/libglib-2.0.0.dylib',
              '../vendor/lib/libgobject-2.0.0.dylib',
              # Ensure runtime linking is relative to sharp.node
              '-rpath \'@loader_path/../../vendor/lib\''
            ]
          }],
          ['OS == "linux"', {
            'variables': {
              'download_vips': '<!(LDD_VERSION="<!(ldd --version 2>&1 || true)" node -e "require(\'./binding\').download_vips()")'
            },
            'defines': [
              '_GLIBCXX_USE_CXX11_ABI=0'
            ],
            'libraries': [
              '../vendor/lib/libvips-cpp.so',
              '../vendor/lib/libvips.so',
              '../vendor/lib/libglib-2.0.so',
              '../vendor/lib/libgobject-2.0.so',
              # Dependencies of dependencies, included for openSUSE support
              '../vendor/lib/libcairo.so',
              '../vendor/lib/libcroco-0.6.so',
              '../vendor/lib/libexif.so',
              '../vendor/lib/libffi.so',
              '../vendor/lib/libfontconfig.so',
              '../vendor/lib/libfreetype.so',
              '../vendor/lib/libgdk_pixbuf-2.0.so',
              '../vendor/lib/libgif.so',
              '../vendor/lib/libgio-2.0.so',
              '../vendor/lib/libgmodule-2.0.so',
              '../vendor/lib/libgsf-1.so',
              '../vendor/lib/libgthread-2.0.so',
              '../vendor/lib/libharfbuzz.so',
              '../vendor/lib/libjpeg.so',
              '../vendor/lib/liblcms2.so',
              '../vendor/lib/liborc-0.4.so',
              '../vendor/lib/libpango-1.0.so',
              '../vendor/lib/libpangocairo-1.0.so',
              '../vendor/lib/libpangoft2-1.0.so',
              '../vendor/lib/libpixman-1.so',
              '../vendor/lib/libpng.so',
              '../vendor/lib/librsvg-2.so',
              '../vendor/lib/libtiff.so',
              '../vendor/lib/libwebp.so',
              '../vendor/lib/libxml2.so',
              '../vendor/lib/libz.so',
              # Ensure runtime linking is relative to sharp.node
              '-Wl,--disable-new-dtags -Wl,-rpath=\'$${ORIGIN}/../../vendor/lib\''
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
            'vendor/lib/GNU.Gettext.dll',
            'vendor/lib/libasprintf-0.dll',
            'vendor/lib/libcairo-2.dll',
            'vendor/lib/libcairo-gobject-2.dll',
            'vendor/lib/libcairo-script-interpreter-2.dll',
            'vendor/lib/libcharset-1.dll',
            'vendor/lib/libcroco-0.6-3.dll',
            'vendor/lib/libexif-12.dll',
            'vendor/lib/libexpat-1.dll',
            'vendor/lib/libffi-6.dll',
            'vendor/lib/libfftw3-3.dll',
            'vendor/lib/libfontconfig-1.dll',
            'vendor/lib/libfreetype-6.dll',
            'vendor/lib/libgcc_s_seh-1.dll',
            'vendor/lib/libgdk_pixbuf-2.0-0.dll',
            'vendor/lib/libgif-7.dll',
            'vendor/lib/libgio-2.0-0.dll',
            'vendor/lib/libglib-2.0-0.dll',
            'vendor/lib/libgmodule-2.0-0.dll',
            'vendor/lib/libgobject-2.0-0.dll',
            'vendor/lib/libgsf-1-114.dll',
            'vendor/lib/libgthread-2.0-0.dll',
            'vendor/lib/libiconv-2.dll',
            'vendor/lib/libintl-8.dll',
            'vendor/lib/libjpeg-62.dll',
            'vendor/lib/liblcms2-2.dll',
            'vendor/lib/libpango-1.0-0.dll',
            'vendor/lib/libpangocairo-1.0-0.dll',
            'vendor/lib/libpangowin32-1.0-0.dll',
            'vendor/lib/libpixman-1-0.dll',
            'vendor/lib/libpng16-16.dll',
            'vendor/lib/libquadmath-0.dll',
            'vendor/lib/librsvg-2-2.dll',
            'vendor/lib/libssp-0.dll',
            'vendor/lib/libstdc++-6.dll',
            'vendor/lib/libtiff-5.dll',
            'vendor/lib/libvips-42.dll',
            'vendor/lib/libwebp-6.dll',
            'vendor/lib/libxml2-2.dll',
            'vendor/lib/zlib1.dll'
          ]
        }]
      }]
    ]
  }]
}
