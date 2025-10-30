/*!
  Copyright 2013 Lovell Fuller and others.
  SPDX-License-Identifier: Apache-2.0
*/

const {
  useGlobalLibvips,
  globalLibvipsVersion,
  log,
  spawnRebuild,
} = require('../lib/libvips');

log('Attempting to build from source via node-gyp');
log('See https://sharp.pixelplumbing.com/install#building-from-source');

try {
  const addonApi = require('node-addon-api');
  log(`Found node-addon-api ${addonApi.version || ''}`);
} catch (_err) {
  log('Please add node-addon-api to your dependencies');
  process.exit(1);
}
try {
  const gyp = require('node-gyp');
  log(`Found node-gyp ${gyp().version}`);
} catch (_err) {
  log('Please add node-gyp to your dependencies');
  process.exit(1);
}

if (useGlobalLibvips(log)) {
  log(`Detected globally-installed libvips v${globalLibvipsVersion()}`);
}

const status = spawnRebuild();
if (status !== 0) {
  process.exit(status);
}
