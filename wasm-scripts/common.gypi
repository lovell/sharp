{
  'variables': {
    'OS': 'emscripten',
    'napi_build_version': '8',
    'clang': 1,
    'target_arch%': 'wasm32',
    'wasm_threads%': 1,
    'asan%': 0,
    'enable_lto%': 'true',
    'product_extension%': 'mjs',
  },

  'target_defaults': {
    # 'shared_library' / 'loadable_module' does something different on Emscripten
    # and only leads to unsupported linker flags being passed to the linker.
    # 'executable' in JS+Wasm sense can act as a library we expect.
    'type': 'executable',

    # Set .mjs extension, both because emcc looks at the extension to know
    # what to generate, and because we do in fact want main output
    # to be an ECMAScript module.
    'product_extension': '<(product_extension)',

    'cflags': [
      '-Wall',
      '-Wextra',
      '-Wno-unused-parameter',
      '-sDEFAULT_TO_CXX=0',
    ],
    'cflags_cc': [
      '-fno-rtti',
      '-fno-exceptions',
      '-std=gnu++17'
    ],
    'ldflags': [
      '--js-library=<!(node -p "require(\'@tybys/emnapi\').js_library")',
      # We're building a library, don't mess with global Node.js error handlers.
      '-sNODEJS_CATCH_EXIT=0',
      '-sNODEJS_CATCH_REJECTION=0',
      # Stricter linking options - don't link HTML5, OpenGL, etc.
      '-sAUTO_JS_LIBRARIES=0',
      '-sAUTO_NATIVE_LIBRARIES=0',
      # We want to treat strings as Unicode rather than as binary data.
      '-sEMBIND_STD_STRING_IS_UTF8=1',
      # emnapi needs Embind
      '--bind',
    ],
    'defines': [
      '__STDC_FORMAT_MACROS',
      'BUILDING_NODE_EXTENSION'
    ],
    'include_dirs': [
      '<!(node -p "require(\'@tybys/emnapi\').include")',
    ],
    'sources': [
      '<!@(node -p "require(\'@tybys/emnapi\').sources.map(x => JSON.stringify(path.relative(process.cwd(), x))).join(\' \')")'
    ],

    'default_configuration': 'Release',
    'configurations': {
      'Debug': {
        'defines': [ 'DEBUG', '_DEBUG' ],
        'cflags': [ '-g', '-O0' ],
        'ldflags': [ '-g', '-O0', '-sSAFE_HEAP=1' ],
      },
      'Release': {
        'cflags': [ '-O1' ],
        'ldflags': [ '-O1' ],
        'conditions': [
          ['enable_lto == "true"', {
            'cflags': ['-flto'],
            'ldflags': ['-flto'],
          }],
        ],
      }
    },

    'conditions': [
      ['target_arch == "wasm64"', {
        'cflags': [
          '-sMEMORY64=1',
        ],
        'ldflags': [
          '-sMEMORY64=1'
        ]
      }],
      ['asan == 1', {
        'cflags': [
          '-fsanitize=address',
          '-fsanitize-address-use-after-scope',
        ],
        'defines': [ 'LEAK_SANITIZER' ],
        'ldflags': [ '-fsanitize=address' ],
      }],
      ['wasm_threads == 1', {
        'cflags': [ '-pthread' ],
        'ldflags': [ '-pthread' ],
      }],
    ],
  }
}
