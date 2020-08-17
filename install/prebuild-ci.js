'use strict';

const { execFileSync } = require('child_process');

const { prebuild_upload: hasToken, APPVEYOR_REPO_TAG_NAME, TRAVIS_TAG } = process.env;

if (hasToken && (APPVEYOR_REPO_TAG_NAME || TRAVIS_TAG)) {
  execFileSync('prebuild', ['--runtime', 'napi', '--target', '3'], { stdio: 'inherit' });
}
