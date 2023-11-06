// Copyright 2013 Lovell Fuller and others.
// SPDX-License-Identifier: Apache-2.0

'use strict';

// Populate contents of all packages with the current GitHub release

const { readFile, writeFile, appendFile, copyFile, rm } = require('node:fs/promises');
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

const licensing = `
## Licensing

Copyright 2013 Lovell Fuller and others.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at
[https://www.apache.org/licenses/LICENSE-2.0](https://www.apache.org/licenses/LICENSE-2.0)

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
`;

workspaces.map(async platform => {
  const prebuildPlatform = platform === 'wasm32' ? 'emscripten-wasm32' : platform;
  const url = `https://github.com/lovell/sharp/releases/download/v${version}/sharp-v${version}-napi-v9-${prebuildPlatform}.tar.gz`;
  const dir = path.join(__dirname, platform);
  const response = await fetch(url);
  if (!response.ok) {
    console.log(`Skipping ${platform}: ${response.statusText}`);
    return;
  }
  // Extract prebuild tarball
  const lib = path.join(dir, 'lib');
  await rm(lib, { force: true, recursive: true });
  await pipeline(
    Readable.fromWeb(response.body),
    createGunzip(),
    extract(lib, { map: mapTarballEntry })
  );
  // Generate README
  const { name, description } = require(`./${platform}/package.json`);
  await writeFile(path.join(dir, 'README.md'), `# \`${name}\`\n\n${description}.\n${licensing}`);
  // Copy Apache-2.0 LICENSE
  await copyFile(path.join(__dirname, '..', 'LICENSE'), path.join(dir, 'LICENSE'));
  // Copy files for packages without an explicit sharp-libvips dependency (Windows, wasm)
  if (platform.startsWith('win') || platform.startsWith('wasm')) {
    const sharpLibvipsDir = path.join(require(`@img/sharp-libvips-${platform}/lib`), '..');
    // Copy versions.json
    await copyFile(path.join(sharpLibvipsDir, 'versions.json'), path.join(dir, 'versions.json'));
    // Append third party licensing to README
    const readme = await readFile(path.join(sharpLibvipsDir, 'README.md'), { encoding: 'utf-8' });
    const thirdParty = readme.substring(readme.indexOf('\nThis software contains'));
    appendFile(path.join(dir, 'README.md'), thirdParty);
  }
});
