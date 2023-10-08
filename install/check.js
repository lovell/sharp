// Copyright 2013 Lovell Fuller and others.
// SPDX-License-Identifier: Apache-2.0

'use strict';

const { useGlobalLibvips, globalLibvipsVersion, log, spawnRebuild } = require('../lib/libvips');

const buildFromSource = (msg) => {
  log(msg);
  log('Attempting to build from source via node-gyp');
  try {
    require('node-addon-api');
    log('Found node-addon-api');
  } catch (err) {
    log('Please add node-addon-api to your dependencies');
    return;
  }
  try {
    const gyp = require('node-gyp');
    log(`Found node-gyp version ${gyp().version}`);
  } catch (err) {
    log('Please add node-gyp to your dependencies');
    return;
  }
  log('See https://sharp.pixelplumbing.com/install#building-from-source');
  const status = spawnRebuild();
  if (status !== 0) {
    process.exit(status);
  }
};

if (useGlobalLibvips()) {
  buildFromSource(`Detected globally-installed libvips v${globalLibvipsVersion()}`);
} else if (process.env.npm_config_build_from_source) {
  buildFromSource('Detected --build-from-source flag');
}
