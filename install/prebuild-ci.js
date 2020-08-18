'use strict';

const { spawnSync } = require('child_process');

const { prebuild_upload: hasToken, APPVEYOR_REPO_TAG, TRAVIS_TAG } = process.env;

if (hasToken && (Boolean(APPVEYOR_REPO_TAG) || TRAVIS_TAG)) {
  spawnSync(
    'node ./node_modules/.bin/prebuild --runtime napi --target 3',
    { shell: true, stdio: 'inherit' }
  );
}
