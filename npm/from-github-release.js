// Copyright 2013 Lovell Fuller and others.
// SPDX-License-Identifier: Apache-2.0

'use strict';

// Populate contents of all packages with the current GitHub release

const { writeFile, copyFile } = require('node:fs/promises');
const path = require('node:path');
const { Readable } = require('node:stream');
const { pipeline } = require('node:stream/promises');
const { createGunzip } = require('node:zlib');
const { extract } = require('tar-fs');

const { workspaces } = require('./package.json');
const { version } = require('../package.json');

const mapTarballEntry = (header) => {
  header.name = path.basename(header.name);
  return header;
};

workspaces.map(async platform => {
  const url = `https://github.com/lovell/sharp/releases/download/v${version}/sharp-v${version}-napi-v7-${platform}.tar.gz`;
  const dir = path.join(__dirname, platform);
  const response = await fetch(url);
  if (!response.ok) {
    console.log(`Skipping ${platform}: ${response.statusText}`);
    return;
  }
  // Extract prebuild tarball
  await pipeline(
    Readable.fromWeb(response.body),
    createGunzip(),
    extract(path.join(dir, 'lib'), { map: mapTarballEntry })
  );
  // Generate README
  const { name, description } = require(`./${platform}/package.json`);
  await writeFile(path.join(dir, 'README.md'), `# ${name}\n${description}`);
  // Copy Apache-2.0 LICENSE
  await copyFile(path.join(__dirname, '..', 'LICENSE'), path.join(dir, 'LICENSE'));
  // Copy Windows-specific files
  if (platform.startsWith('win32-')) {
    const sharpLibvipsDir = path.join(require(`@sharpen/sharp-libvips-${platform}/lib`), '..');
    await Promise.all(
      ['versions.json', 'THIRD-PARTY-NOTICES.md'].map(
        filename => copyFile(path.join(sharpLibvipsDir, filename), path.join(dir, filename))
      )
    );
  }
});
