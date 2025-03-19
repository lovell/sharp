// Copyright 2013 Lovell Fuller and others.
// SPDX-License-Identifier: Apache-2.0

'use strict';

// Inspects the runtime environment and exports the relevant sharp.node binary

const { familySync, versionSync } = require('detect-libc');

const { runtimePlatformArch, isUnsupportedNodeRuntime, prebuiltPlatforms, minimumLibvipsVersion } = require('./libvips');
const runtimePlatform = runtimePlatformArch();

const paths = [
  `../src/build/Release/sharp-${runtimePlatform}.node`,
  '../src/build/Release/sharp-wasm32.node',
  `@img/sharp-${runtimePlatform}/sharp.node`,
  '@img/sharp-wasm32/sharp.node'
];

let path, sharp;
const errors = [];
for (path of paths) {
  try {
    sharp = require(path);
    break;
  } catch (err) {
    /* istanbul ignore next */
    errors.push(err);
  }
}

/* istanbul ignore next */
if (sharp && path.startsWith('@img/sharp-linux-x64') && !sharp._isUsingX64V2()) {
  const err = new Error('Prebuilt binaries for linux-x64 require v2 microarchitecture');
  err.code = 'Unsupported CPU';
  errors.push(err);
  sharp = null;
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
  if (isUnsupportedNodeRuntime()) {
    const { found, expected } = isUnsupportedNodeRuntime();
    help.push(
      '- Please upgrade Node.js:',
      `    Found ${found}`,
      `    Requires ${expected}`
    );
  } else if (prebuiltPlatforms.includes(runtimePlatform)) {
    const [os, cpu] = runtimePlatform.split('-');
    const libc = os.endsWith('musl') ? ' --libc=musl' : '';
    help.push(
      '- Ensure optional dependencies can be installed:',
      '    npm install --include=optional sharp',
      '- Ensure your package manager supports multi-platform installation:',
      '    See https://sharp.pixelplumbing.com/install#cross-platform',
      '- Add platform-specific dependencies:',
      `    npm install --os=${os.replace('musl', '')}${libc} --cpu=${cpu} sharp`
    );
  } else {
    help.push(
      `- Manually install libvips >= ${minimumLibvipsVersion}`,
      '- Add experimental WebAssembly-based dependencies:',
      '    npm install --cpu=wasm32 sharp',
      '    npm install @img/sharp-wasm32'
    );
  }
  if (isLinux && /(symbol not found|CXXABI_)/i.test(messages)) {
    try {
      const { config } = require(`@img/sharp-libvips-${runtimePlatform}/package`);
      const libcFound = `${familySync()} ${versionSync()}`;
      const libcRequires = `${config.musl ? 'musl' : 'glibc'} ${config.musl || config.glibc}`;
      help.push(
        '- Update your OS:',
        `    Found ${libcFound}`,
        `    Requires ${libcRequires}`
      );
    } catch (errEngines) {}
  }
  if (isLinux && /\/snap\/core[0-9]{2}/.test(messages)) {
    help.push(
      '- Remove the Node.js Snap, which does not support native modules',
      '    snap remove node'
    );
  }
  if (isMacOs && /Incompatible library version/.test(messages)) {
    help.push(
      '- Update Homebrew:',
      '    brew update && brew upgrade vips'
    );
  }
  if (errors.some(err => err.code === 'ERR_DLOPEN_DISABLED')) {
    help.push('- Run Node.js without using the --no-addons flag');
  }
  // Link to installation docs
  if (isWindows && /The specified procedure could not be found/.test(messages)) {
    help.push(
      '- Using the canvas package on Windows?',
      '    See https://sharp.pixelplumbing.com/install#canvas-and-windows',
      '- Check for outdated versions of sharp in the dependency tree:',
      '    npm ls sharp'
    );
  }
  help.push(
    '- Consult the installation documentation:',
    '    See https://sharp.pixelplumbing.com/install'
  );
  throw new Error(help.join('\n'));
}
