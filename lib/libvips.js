/*!
  Copyright 2013 Lovell Fuller and others.
  SPDX-License-Identifier: Apache-2.0
*/

const { spawnSync } = require('node:child_process');
const { createHash } = require('node:crypto');
const semverCoerce = require('semver/functions/coerce');
const semverGreaterThanOrEqualTo = require('semver/functions/gte');
const semverSatisfies = require('semver/functions/satisfies');
const detectLibc = require('detect-libc');

const { config, engines, optionalDependencies } = require('../package.json');

/* node:coverage ignore next */
const minimumLibvipsVersionLabelled = process.env.npm_package_config_libvips || config.libvips;
const minimumLibvipsVersion = semverCoerce(minimumLibvipsVersionLabelled).version;

const prebuiltPlatforms = [
  'darwin-arm64', 'darwin-x64',
  'linux-arm', 'linux-arm64', 'linux-ppc64', 'linux-riscv64', 'linux-s390x', 'linux-x64',
  'linuxmusl-arm64', 'linuxmusl-x64',
  'win32-arm64', 'win32-ia32', 'win32-x64'
];

const spawnSyncOptions = {
  encoding: 'utf8',
  shell: true
};

const log = (item) => {
  if (item instanceof Error) {
    console.error(`sharp: Installation error: ${item.message}`);
  } else {
    console.log(`sharp: ${item}`);
  }
};

/* node:coverage ignore next */
const runtimeLibc = () => detectLibc.isNonGlibcLinuxSync() ? detectLibc.familySync() : '';

const runtimePlatformArch = () => `${process.platform}${runtimeLibc()}-${process.arch}`;

const buildPlatformArch = () => {
  /* node:coverage ignore next 3 */
  if (isEmscripten()) {
    return 'wasm32';
  }
  const { npm_config_arch, npm_config_platform, npm_config_libc } = process.env;
  const libc = typeof npm_config_libc === 'string' ? npm_config_libc : runtimeLibc();
  return `${npm_config_platform || process.platform}${libc}-${npm_config_arch || process.arch}`;
};

const buildSharpLibvipsIncludeDir = () => {
  try {
    return require(`@img/sharp-libvips-dev-${buildPlatformArch()}/include`);
  } catch {
    /* node:coverage ignore next 5 */
    try {
      return require('@img/sharp-libvips-dev/include');
    } catch {}
  }
  return '';
};

const buildSharpLibvipsCPlusPlusDir = () => {
  /* node:coverage ignore next 4 */
  try {
    return require('@img/sharp-libvips-dev/cplusplus');
  } catch {}
  return '';
};

const buildSharpLibvipsLibDir = () => {
  try {
    return require(`@img/sharp-libvips-dev-${buildPlatformArch()}/lib`);
  } catch {
    /* node:coverage ignore next 5 */
    try {
      return require(`@img/sharp-libvips-${buildPlatformArch()}/lib`);
    } catch {}
  }
  return '';
};

/* node:coverage disable */

const isUnsupportedNodeRuntime = () => {
  if (process.release?.name === 'node' && process.versions) {
    if (!semverSatisfies(process.versions.node, engines.node)) {
      return { found: process.versions.node, expected: engines.node };
    }
  }
};

const isEmscripten = () => {
  const { CC } = process.env;
  return Boolean(CC?.endsWith('/emcc'));
};

const isRosetta = () => {
  if (process.platform === 'darwin' && process.arch === 'x64') {
    const translated = spawnSync('sysctl sysctl.proc_translated', spawnSyncOptions).stdout;
    return (translated || '').trim() === 'sysctl.proc_translated: 1';
  }
  return false;
};

/* node:coverage enable */

const sha512 = (s) => createHash('sha512').update(s).digest('hex');

const yarnLocator = () => {
  try {
    const identHash = sha512(`imgsharp-libvips-${buildPlatformArch()}`);
    const npmVersion = semverCoerce(optionalDependencies[`@img/sharp-libvips-${buildPlatformArch()}`], {
      includePrerelease: true
    }).version;
    return sha512(`${identHash}npm:${npmVersion}`).slice(0, 10);
  } catch {}
  return '';
};

/* node:coverage disable */

const spawnRebuild = () =>
  spawnSync(`node-gyp rebuild --directory=src ${isEmscripten() ? '--nodedir=emscripten' : ''}`, {
    ...spawnSyncOptions,
    stdio: 'inherit'
  }).status;

const globalLibvipsVersion = () => {
  if (process.platform !== 'win32') {
    const globalLibvipsVersion = spawnSync('pkg-config --modversion vips-cpp', {
      ...spawnSyncOptions,
      env: {
        ...process.env,
        PKG_CONFIG_PATH: pkgConfigPath()
      }
    }).stdout;
    return (globalLibvipsVersion || '').trim();
  } else {
    return '';
  }
};

/* node:coverage enable */

const pkgConfigPath = () => {
  if (process.platform !== 'win32') {
    /* node:coverage ignore next 4 */
    const brewPkgConfigPath = spawnSync(
      'which brew >/dev/null 2>&1 && brew environment --plain | grep PKG_CONFIG_LIBDIR | cut -d" " -f2',
      spawnSyncOptions
    ).stdout || '';
    return [
      brewPkgConfigPath.trim(),
      process.env.PKG_CONFIG_PATH,
      '/usr/local/lib/pkgconfig',
      '/usr/lib/pkgconfig',
      '/usr/local/libdata/pkgconfig',
      '/usr/libdata/pkgconfig'
    ].filter(Boolean).join(':');
  } else {
    return '';
  }
};

const skipSearch = (status, reason, logger) => {
  if (logger) {
    logger(`Detected ${reason}, skipping search for globally-installed libvips`);
  }
  return status;
};

const useGlobalLibvips = (logger) => {
  if (Boolean(process.env.SHARP_IGNORE_GLOBAL_LIBVIPS) === true) {
    return skipSearch(false, 'SHARP_IGNORE_GLOBAL_LIBVIPS', logger);
  }
  if (Boolean(process.env.SHARP_FORCE_GLOBAL_LIBVIPS) === true) {
    return skipSearch(true, 'SHARP_FORCE_GLOBAL_LIBVIPS', logger);
  }
  /* node:coverage ignore next 3 */
  if (isRosetta()) {
    return skipSearch(false, 'Rosetta', logger);
  }
  const globalVipsVersion = globalLibvipsVersion();
  /* node:coverage ignore next */
  return !!globalVipsVersion && semverGreaterThanOrEqualTo(globalVipsVersion, minimumLibvipsVersion);
};

module.exports = {
  minimumLibvipsVersion,
  prebuiltPlatforms,
  buildPlatformArch,
  buildSharpLibvipsIncludeDir,
  buildSharpLibvipsCPlusPlusDir,
  buildSharpLibvipsLibDir,
  isUnsupportedNodeRuntime,
  runtimePlatformArch,
  log,
  yarnLocator,
  spawnRebuild,
  globalLibvipsVersion,
  pkgConfigPath,
  useGlobalLibvips
};
