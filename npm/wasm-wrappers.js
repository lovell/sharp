/*!
  Copyright 2013 Lovell Fuller and others.
  SPDX-License-Identifier: Apache-2.0
*/

// Populate WebAssembly wrapper packages

const { copyFileSync, readFileSync, writeFileSync } = require('node:fs');
const { join } = require('node:path');

const platforms = [
  'freebsd-wasm32',
  'webcontainers-wasm32'
];

const readme = readFileSync(join(__dirname, '..', 'README.md'), 'utf8');
const licensing = readme.substring(readme.indexOf('## Licensing'));

for (const platform of platforms) {
  const destDir = join(__dirname, platform);
  console.log(`Populating npm package for platform: ${platform}`);

  // Generate README.md
  const { name, description } = require(`./${platform}/package.json`);
  writeFileSync(join(destDir, 'README.md'), `# \`${name}\`\n\n${description}.\n\n${licensing}`);

  // Copy Apache-2.0 LICENSE
  copyFileSync(join(__dirname, '..', 'LICENSE'), join(destDir, 'LICENSE'));
}
