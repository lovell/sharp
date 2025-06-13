// Copyright 2013 Lovell Fuller and others.
// SPDX-License-Identifier: Apache-2.0

'use strict';

// Populate the npm package for the current platform with the local build

const { copyFileSync, cpSync, readFileSync, writeFileSync, appendFileSync } = require('node:fs');
const { basename, join } = require('node:path');

const { buildPlatformArch } = require('../lib/libvips');

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

const platform = buildPlatformArch();
const destDir = join(__dirname, platform);
console.log(`Populating npm package for platform: ${platform}`);

// Copy binaries
const releaseDir = join(__dirname, '..', 'src', 'build', 'Release');
const libDir = join(destDir, 'lib');
cpSync(releaseDir, libDir, {
  recursive: true,
  filter: (file) => {
    const name = basename(file);
    return name === 'Release' ||
      (name.startsWith('sharp-') && name.includes('.node')) ||
      (name.startsWith('libvips-') && name.endsWith('.dll'));
  }
});

// Generate README
const { name, description } = require(`./${platform}/package.json`);
writeFileSync(join(destDir, 'README.md'), `# \`${name}\`\n\n${description}.\n${licensing}`);

// Copy Apache-2.0 LICENSE
copyFileSync(join(__dirname, '..', 'LICENSE'), join(destDir, 'LICENSE'));

// Copy files for packages without an explicit sharp-libvips dependency (Windows, wasm)
if (platform.startsWith('win') || platform.startsWith('wasm')) {
  const libvipsPlatform = platform === 'wasm32' ? 'dev-wasm32' : platform;
  const sharpLibvipsDir = join(require(`@img/sharp-libvips-${libvipsPlatform}/lib`), '..');
  // Copy versions.json
  copyFileSync(join(sharpLibvipsDir, 'versions.json'), join(destDir, 'versions.json'));
  // Append third party licensing to README
  const readme = readFileSync(join(sharpLibvipsDir, 'README.md'), { encoding: 'utf-8' });
  const thirdParty = readme.substring(readme.indexOf('\nThis software contains'));
  appendFileSync(join(destDir, 'README.md'), thirdParty);
}
