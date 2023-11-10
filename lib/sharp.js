// Copyright 2013 Lovell Fuller and others.
// SPDX-License-Identifier: Apache-2.0

'use strict';

// Inspects the runtime environment and exports the relevant sharp.node binary

const { familySync, versionSync } = require('detect-libc');

const { runtimePlatformArch, prebuiltPlatforms, minimumLibvipsVersion } = require('./libvips');
const runtimePlatform = runtimePlatformArch();

const paths = [
  `../src/build/Release/sharp-${runtimePlatform}.node`,
  '../src/build/Release/sharp-wasm32.node',
  `@img/sharp-${runtimePlatform}/sharp.node`,
  '@img/sharp-wasm32/sharp.node'
];

let sharp;
const errors = [];
for (const path of paths) {
  try {
    sharp = require(path);
    break;
  } catch (err) {
    /* istanbul ignore next */
    errors.push(err);
  }
}

/* istanbul ignore next */
if (sharp) {
  module.exports = sharp;
} else {
  const [isLinux, isMacOs, isWindows] = ['linux', 'darwin', 'win32'].map(os => runtimePlatform.startsWith(os));

  const help = [`Could not load the "sharp" module using the ${runtimePlatform} runtime`];
  errors.forEach(err => {
    if (err.code !== 'MODULE_NOT_FOUND') {
      help.push(`${err.code}: ${err.message}`);
    }
  });
  const messages = errors.map(err => err.message).join(' ');
  help.push('Possible solutions:');
  // Common error messages
  if (prebuiltPlatforms.includes(runtimePlatform)) {
    const [os, cpu] = runtimePlatform.split('-');
    help.push('- Add platform-specific dependencies:');
    help.push(`    npm install --os=${os} --cpu=${cpu} sharp`);
    help.push('  or');
    help.push(`    npm install --force @img/sharp-${runtimePlatform}`);
  } else {
    help.push(`- Manually install libvips >= ${minimumLibvipsVersion}`);
    help.push('- Add experimental WebAssembly-based dependencies:');
    help.push('    npm install --cpu=wasm32 sharp');
  }
  if (isLinux && /symbol not found/i.test(messages)) {
    try {
      const { engines } = require(`@img/sharp-libvips-${runtimePlatform}/package`);
      const libcFound = `${familySync()} ${versionSync()}`;
      const libcRequires = `${engines.musl ? 'musl' : 'glibc'} ${engines.musl || engines.glibc}`;
      help.push('- Update your OS:');
      help.push(`    Found ${libcFound}`);
      help.push(`    Requires ${libcRequires}`);
    } catch (errEngines) {}
  }
  if (isMacOs && /Incompatible library version/.test(messages)) {
    help.push('- Update Homebrew:');
    help.push('    brew update && brew upgrade vips');
  }
  if (errors.some(err => err.code === 'ERR_DLOPEN_DISABLED')) {
    help.push('- Run Node.js without using the --no-addons flag');
  }
  if (process.versions.pnp) {
    help.push('- Use a supported yarn linker, either pnpm or node-modules:');
    help.push('    yarn config set nodeLinker node-modules');
  }
  // Link to installation docs
  if (isWindows && /The specified procedure could not be found/.test(messages)) {
    help.push('- Using the canvas package on Windows? See https://sharp.pixelplumbing.com/install#canvas-and-windows');
  } else {
    help.push('- Consult the installation documentation: https://sharp.pixelplumbing.com/install');
  }
  throw new Error(help.join('\n'));
}
