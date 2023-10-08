// Copyright 2013 Lovell Fuller and others.
// SPDX-License-Identifier: Apache-2.0

'use strict';

// Populate contents of a single npm/sharpen-sharp-<build-platform> package
// with the local/CI build directory for local/CI prebuild testing

const fs = require('node:fs');
const path = require('node:path');

const { buildPlatformArch } = require('../lib/libvips');
const platform = buildPlatformArch();
const dest = path.join(__dirname, platform);

// Use same config as prebuild to copy binary files
const release = path.join(__dirname, '..', 'src', 'build', 'Release');
const prebuildrc = JSON.parse(fs.readFileSync(path.join(__dirname, '..', '.prebuildrc'), 'utf8'));
const include = new RegExp(prebuildrc['include-regex'], 'i');
fs.cpSync(release, path.join(dest, 'lib'), {
  recursive: true,
  filter: (file) => {
    const name = path.basename(file);
    return name === 'Release' || include.test(name);
  }
});
