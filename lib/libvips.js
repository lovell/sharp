// Copyright 2013 Lovell Fuller and others.
// SPDX-License-Identifier: Apache-2.0

'use strict';

const { spawnSync } = require('node:child_process');
const semverCoerce = require('semver/functions/coerce');
const semverGreaterThanOrEqualTo = require('semver/functions/gte');
const detectLibc = require('detect-libc');

const { engines } = require('../package.json');

const minimumLibvipsVersionLabelled = process.env.npm_package_config_libvips || /* istanbul ignore next */
  engines.libvips;
const minimumLibvipsVersion = semverCoerce(minimumLibvipsVersionLabelled).version;

const prebuiltPlatforms = [
  'darwin-arm64', 'darwin-x64',
  'linux-arm', 'linux-arm64', 'linux-s390x', 'linux-x64',
  'linuxmusl-arm64', 'linuxmusl-x64',
  'win32-ia32', 'win32-x64'
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

/* istanbul ignore next */
const runtimeLibc = () => detectLibc.isNonGlibcLinuxSync() ? detectLibc.familySync() : '';

const runtimePlatformArch = () => `${process.platform}${runtimeLibc()}-${process.arch}`;

/* istanbul ignore next */
const buildPlatformArch = () => {
  if (isEmscripten()) {
    return 'wasm32';
  }
  /* eslint camelcase: ["error", { allow: ["^npm_config_"] }] */
  const { npm_config_arch, npm_config_platform, npm_config_libc } = process.env;
  const libc = typeof npm_config_libc === 'string' ? npm_config_libc : runtimeLibc();
  return `${npm_config_platform || process.platform}${libc}-${npm_config_arch || process.arch}`;
};

const buildSharpLibvipsIncludeDir = () => {
  try {
    return require(`@img/sharp-libvips-dev-${buildPlatformArch()}/include`);
  } catch {
    try {
      return require('@img/sharp-libvips-dev/include');
    } catch {}
  }
  /* istanbul ignore next */
  return '';
};

const buildSharpLibvipsCPlusPlusDir = () => {
  try {
    return require('@img/sharp-libvips-dev/cplusplus');
  } catch {}
  /* istanbul ignore next */
  return '';
};

const buildSharpLibvipsLibDir = () => {
  try {
    return require(`@img/sharp-libvips-dev-${buildPlatformArch()}/lib`);
  } catch {
    try {
      return require(`@img/sharp-libvips-${buildPlatformArch()}/lib`);
    } catch {}
  }
  /* istanbul ignore next */
  return '';
};

/* istanbul ignore next */
const isEmscripten = () => {
  const { CC } = process.env;
  return Boolean(CC && CC.endsWith('/emcc'));
};

const isRosetta = () => {
  /* istanbul ignore next */
  if (process.platform === 'darwin' && process.arch === 'x64') {
    const translated = spawnSync('sysctl sysctl.proc_translated', spawnSyncOptions).stdout;
    return (translated || '').trim() === 'sysctl.proc_translated: 1';
  }
  return false;
};

/* istanbul ignore next */
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
    /* istanbul ignore next */
    return (globalLibvipsVersion || '').trim();
  } else {
    return '';
  }
};

/* istanbul ignore next */
const pkgConfigPath = () => {
  if (process.platform !== 'win32') {
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

const useGlobalLibvips = () => {
  if (Boolean(process.env.SHARP_IGNORE_GLOBAL_LIBVIPS) === true) {
    log('Detected SHARP_IGNORE_GLOBAL_LIBVIPS, skipping search for globally-installed libvips');
    return false;
  }
  /* istanbul ignore next */
  if (isRosetta()) {
    log('Detected Rosetta, skipping search for globally-installed libvips');
    return false;
  }
  const globalVipsVersion = globalLibvipsVersion();
  return !!globalVipsVersion && /* istanbul ignore next */
    semverGreaterThanOrEqualTo(globalVipsVersion, minimumLibvipsVersion);
};

module.exports = {
  minimumLibvipsVersion,
  prebuiltPlatforms,
  buildPlatformArch,
  buildSharpLibvipsIncludeDir,
  buildSharpLibvipsCPlusPlusDir,
  buildSharpLibvipsLibDir,
  runtimePlatformArch,
  log,
  spawnRebuild,
  globalLibvipsVersion,
  pkgConfigPath,
  useGlobalLibvips
};
