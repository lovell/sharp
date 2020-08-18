'use strict';

const { execFileSync } = require('child_process');

const { prebuild_upload: hasToken, APPVEYOR_REPO_TAG, TRAVIS_TAG } = process.env;

if (hasToken && (Boolean(APPVEYOR_REPO_TAG) || TRAVIS_TAG)) {
  execFileSync('prebuild', ['--runtime', 'napi', '--target', '3'], { stdio: 'inherit' });
}
