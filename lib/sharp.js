// Copyright 2013 Lovell Fuller and others.
// SPDX-License-Identifier: Apache-2.0

'use strict';

// Inspects the runtime environment and exports the relevant sharp.node binary

const { familySync, versionSync } = require('detect-libc');

const { runtimePlatformArch, prebuiltPlatforms, minimumLibvipsVersion } = require('./libvips');
const runtimePlatform = runtimePlatformArch();
const [isLinux, isMacOs, isWindows] = ['linux', 'darwin', 'win32'].map(os => runtimePlatform.startsWith(os));

/* istanbul ignore next */
try {
  // Check for local build
  module.exports = require(`../src/build/Release/sharp-${runtimePlatform}.node`);
} catch (errLocal) {
  try {
    // Check for runtime package
    module.exports = require(`@sharpen/sharp-${runtimePlatform}/sharp.node`);
  } catch (errPackage) {
    const help = ['Could not load the "sharp" module at runtime'];
    if (errLocal.code !== 'MODULE_NOT_FOUND') {
      help.push(`${errLocal.code}: ${errLocal.message}`);
    }
    if (errPackage.code !== 'MODULE_NOT_FOUND') {
      help.push(`${errPackage.code}: ${errPackage.message}`);
    }
    help.push('Possible solutions:');
    // Common error messages
    if (prebuiltPlatforms.includes(runtimePlatform)) {
      help.push('- Add an explicit dependency for the runtime platform:');
      help.push(`    npm install --force @sharpen/sharp-${runtimePlatform}"`);
    } else {
      help.push(`- The ${runtimePlatform} platform requires manual installation of libvips >= ${minimumLibvipsVersion}`);
    }
    if (isLinux && /symbol not found/i.test(errPackage)) {
      try {
        const { engines } = require(`@sharpen/sharp-libvips-${runtimePlatform}/package`);
        const libcFound = `${familySync()} ${versionSync()}`;
        const libcRequires = `${engines.musl ? 'musl' : 'glibc'} ${engines.musl || engines.glibc}`;
        help.push('- Update your OS:');
        help.push(`    Found ${libcFound}`);
        help.push(`    Requires ${libcRequires}`);
      } catch (errEngines) {}
    }
    if (isMacOs && /Incompatible library version/.test(errLocal.message)) {
      help.push('- Update Homebrew:');
      help.push('    brew update && brew upgrade vips');
    }
    if (errPackage.code === 'ERR_DLOPEN_DISABLED') {
      help.push('- Run Node.js without using the --no-addons flag');
    }
    if (process.versions.pnp) {
      help.push('- Use a supported yarn linker, either pnpm or node-modules:');
      help.push('    yarn config set nodeLinker node-modules');
    }
    // Link to installation docs
    if (isLinux && /Module did not self-register/.test(errLocal.message + errPackage.message)) {
      help.push('- Using worker threads on Linux? See https://sharp.pixelplumbing.com/install#worker-threads');
    } else if (isWindows && /The specified procedure could not be found/.test(errPackage.message)) {
      help.push('- Using the canvas package on Windows? See https://sharp.pixelplumbing.com/install#canvas-and-windows');
    } else {
      help.push('- Consult the installation documentation: https://sharp.pixelplumbing.com/install');
    }
    throw new Error(help.join('\n'));
  }
}
