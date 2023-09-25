// Copyright 2013 Lovell Fuller and others.
// SPDX-License-Identifier: Apache-2.0

'use strict';

const { useGlobalLibvips, globalLibvipsVersion, log, gypRebuild } = require('../lib/libvips');

const buildFromSource = (msg) => {
  log(msg);
  log('Attempting to build from source via node-gyp');
  try {
    require('node-gyp');
  } catch (err) {
    log('You might need to install node-gyp');
    log('See https://sharp.pixelplumbing.com/install#building-from-source');
  }
  const status = gypRebuild();
  if (status !== 0) {
    process.exit(status);
  }
};

if (process.env.npm_config_build_from_source) {
  buildFromSource('Detected --build-from-source flag');
} else if (useGlobalLibvips()) {
  buildFromSource(`Detected globally-installed libvips v${globalLibvipsVersion()}`);
}
