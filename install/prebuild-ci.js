'use strict';

const { spawnSync } = require('child_process');

const { prebuild_upload: hasToken, APPVEYOR_REPO_TAG_NAME, TRAVIS_TAG } = process.env;

if (hasToken && (APPVEYOR_REPO_TAG_NAME || TRAVIS_TAG)) {
  spawnSync('node',
    ['./node_modules/prebuild/bin.js', '--runtime', 'napi', '--target', '3'],
    { shell: true, stdio: 'inherit' }
  );
}
