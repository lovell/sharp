{
  'variables': {
    'vips_version': '<!(node -p "require(\'./lib/libvips\').minimumLibvipsVersion")',
    'platform_and_arch': '<!(node -p "require(\'./lib/platform\')()")',
    'sharp_vendor_dir': './vendor/<(vips_version)/<(platform_and_arch)'
  },
  'targets': [{
    'target_name': 'libvips-cpp',
    'conditions': [
      ['OS == "win"', {
        # Build libvips C++ binding for Windows due to MSVC std library ABI changes
        'type': 'shared_library',
        'defines': [
          'VIPS_CPLUSPLUS_EXPORTS',
          '_ALLOW_KEYWORD_MACROS'
        ],
        'sources': [
          'src/libvips/cplusplus/VConnection.cpp',
          'src/libvips/cplusplus/VError.cpp',
          'src/libvips/cplusplus/VImage.cpp',
          'src/libvips/cplusplus/VInterpolate.cpp',
          'src/libvips/cplusplus/VRegion.cpp'
        ],
        'include_dirs': [
          '<(sharp_vendor_dir)/include',
          '<(sharp_vendor_dir)/include/glib-2.0',
          '<(sharp_vendor_dir)/lib/glib-2.0/include'
        ],
        'link_settings': {
          'library_dirs': ['<(sharp_vendor_dir)/lib'],
          'libraries': [
            'libvips.lib',
            'libglib-2.0.lib',
            'libgobject-2.0.lib'
          ],
        },
        'configurations': {
          'Release': {
            'msvs_settings': {
              'VCCLCompilerTool': {
                'ExceptionHandling': 1,
                'Optimization': 1,
                'WholeProgramOptimization': 'true'
              },
              'VCLibrarianTool': {
                'AdditionalOptions': [
                  '/LTCG:INCREMENTAL'
                ]
              },
              'VCLinkerTool': {
                'ImageHasSafeExceptionHandlers': 'false',
                'OptimizeReferences': 2,
                'EnableCOMDATFolding': 2,
                'LinkIncremental': 1,
                'AdditionalOptions': [
                  '/LTCG:INCREMENTAL'
                ]
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
    'target_name': 'sharp-<(platform_and_arch)',
    'defines': [
      'NAPI_VERSION=7'
    ],
    'dependencies': [
      '<!(node -p "require(\'node-addon-api\').gyp")',
      'libvips-cpp'
    ],
    'variables': {
      'conditions': [
        ['OS != "emscripten"', {
          'runtime_link%': 'shared',
        }, {
          'runtime_link%': 'static',
        }],
        ['OS != "win"', {
          'pkg_config_path': '<!(node -p "require(\'./lib/libvips\').pkgConfigPath()")',
          'use_global_libvips': '<!(node -p "Boolean(require(\'./lib/libvips\').useGlobalLibvips()).toString()")'
        }, {
          'pkg_config_path': '',
          'use_global_libvips': ''
        }]
      ]
    },
    'sources': [
      'src/common.cc',
      'src/metadata.cc',
      'src/stats.cc',
      'src/operations.cc',
      'src/pipeline.cc',
      'src/utilities.cc',
      'src/sharp.cc'
    ],
    'include_dirs': [
      '<!(node -p "require(\'node-addon-api\').include_dir")',
    ],
    'conditions': [
      ['OS == "emscripten"', {
        # .js because that's how Emscripten knows what to build, and .node
        # in front so that `require('[...].node')` would just work.
        'product_extension': 'node.js',
        'defines': [
          # Limit to 1 async task to avoid stealing threads from the pool
          # that are intended for libvips.
          'EMNAPI_WORKER_POOL_SIZE=1',
        ],
        'cflags': ['-g2'],
        'ldflags': [
          '-g2',
          '-fexceptions',
          # We don't know in advance how large images will be, best to allow growth
          # rather than overallocate in resource-constrained environments.
          '-sALLOW_MEMORY_GROWTH',
          # Building for Node.js, we want sync instantiation for compat with native
          '-sWASM_ASYNC_COMPILATION=0',
          # Re-export emnapi bindings as the main exports
          '--pre-js=<!(node -p "require.resolve(\'./wasm-scripts/pre.js\')")',
          # Using JS implementation of text decoder is actually faster when using pthreads.
          '-sTEXTDECODER=0',
          # Support 64-bit integers.
          '-sWASM_BIGINT',

          # We're building only for Node.js for now
          '-sENVIRONMENT=node',
          # Propagate filesystem to Node.js.
          '-sNODERAWFS',
          # Exit helpers
          '-sEXPORTED_FUNCTIONS=["_vips_shutdown", "_uv__threadpool_cleanup"]',
        ],
      }],
      ['use_global_libvips == "true"', {
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
        # Use pre-built libvips stored locally within node_modules
        'include_dirs': [
          '<(sharp_vendor_dir)/include',
          '<(sharp_vendor_dir)/include/glib-2.0',
          '<(sharp_vendor_dir)/lib/glib-2.0/include'
        ],
        'conditions': [
          ['OS == "win"', {
            'defines': [
              '_ALLOW_KEYWORD_MACROS',
              '_FILE_OFFSET_BITS=64'
            ],
            'link_settings': {
              'library_dirs': ['<(sharp_vendor_dir)/lib'],
              'libraries': [
                'libvips.lib',
                'libglib-2.0.lib',
                'libgobject-2.0.lib'
              ]
            }
          }],
          ['OS == "mac"', {
            'link_settings': {
              'library_dirs': ['../<(sharp_vendor_dir)/lib'],
              'libraries': [
                'libvips-cpp.42.dylib'
              ]
            },
            'xcode_settings': {
              'OTHER_LDFLAGS': [
                # Ensure runtime linking is relative to sharp.node
                '-Wl,-rpath,\'@loader_path/../../<(sharp_vendor_dir)/lib\''
              ]
            }
          }],
          ['OS == "linux"', {
            'defines': [
              '_GLIBCXX_USE_CXX11_ABI=1'
            ],
            'link_settings': {
              'library_dirs': ['../<(sharp_vendor_dir)/lib'],
              'libraries': [
                '-l:libvips-cpp.so.42'
              ],
              'ldflags': [
                # Ensure runtime linking is relative to sharp.node
                '-Wl,-s -Wl,--disable-new-dtags -Wl,-rpath=\'$$ORIGIN/../../<(sharp_vendor_dir)/lib\''
              ]
            }
          }]
        ]
      }]
    ],
    'cflags_cc': [
      '-std=c++0x',
      '-fexceptions',
      '-Wall',
      '-Os'
    ],
    'xcode_settings': {
      'CLANG_CXX_LANGUAGE_STANDARD': 'c++11',
      'MACOSX_DEPLOYMENT_TARGET': '10.9',
      'GCC_ENABLE_CPP_EXCEPTIONS': 'YES',
      'GCC_ENABLE_CPP_RTTI': 'YES',
      'OTHER_CPLUSPLUSFLAGS': [
        '-fexceptions',
        '-Wall',
        '-Oz'
      ]
    },
    'configurations': {
      'Release': {
        'conditions': [
          ['OS == "linux"', {
            'cflags_cc': [
              '-Wno-cast-function-type'
            ]
          }],
          ['target_arch == "arm"', {
            'cflags_cc': [
              '-Wno-psabi'
            ]
          }],
          ['OS == "win"', {
            'msvs_settings': {
              'VCCLCompilerTool': {
                'ExceptionHandling': 1,
                'Optimization': 1,
                'WholeProgramOptimization': 'true'
              },
              'VCLibrarianTool': {
                'AdditionalOptions': [
                  '/LTCG:INCREMENTAL'
                ]
              },
              'VCLinkerTool': {
                'ImageHasSafeExceptionHandlers': 'false',
                'OptimizeReferences': 2,
                'EnableCOMDATFolding': 2,
                'LinkIncremental': 1,
                'AdditionalOptions': [
                  '/LTCG:INCREMENTAL'
                ]
              }
            },
            'msvs_disabled_warnings': [
              4275
            ]
          }]
        ]
      }
    },
  }]
}
