# Copyright 2013 Lovell Fuller and others.
# SPDX-License-Identifier: Apache-2.0

{
  'variables': {
    'OS': 'emscripten'
  },
  'target_defaults': {
    'default_configuration': 'Release',
    'type': 'executable',
    'cflags': [
      '-pthread'
    ],
    'cflags_cc': [
      '-pthread'
    ],
    'ldflags': [
      '--js-library=<!(node -p "require(\'emnapi\').js_library")',
      '-sEXPORTED_FUNCTIONS=_vips_shutdown,_uv_library_shutdown,<!(node -p "require(\'emnapi\').requiredConfig.emscripten.settings.EXPORTED_FUNCTIONS.join(\',\')")',
      '-sEXPORTED_RUNTIME_METHODS=<!(node -p "require(\'emnapi\').requiredConfig.emscripten.settings.EXPORTED_RUNTIME_METHODS.join(\',\')")',
      '-sAUTO_JS_LIBRARIES=0',
      '-sAUTO_NATIVE_LIBRARIES=0',
      '-sDEFAULT_TO_CXX=0'
    ],
    'defines': [
      '__STDC_FORMAT_MACROS',
      'BUILDING_NODE_EXTENSION',
      'EMNAPI_WORKER_POOL_SIZE=1'
    ],
    'include_dirs': [
      '<!(node -p "require(\'emnapi\').include_dir")'
    ],
    'sources': [
      '<!@(node -p "require(\'emnapi\').sources.map(x => JSON.stringify(path.relative(process.cwd(), x))).join(\' \')")'
    ],
    'configurations': {
      'Release': {}
    }
  }
}
