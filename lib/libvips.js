'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const spawnSync = require('child_process').spawnSync;
const semverCoerce = require('semver/functions/coerce');
const semverGreaterThanOrEqualTo = require('semver/functions/gte');

const platform = require('./platform');
const { config } = require('../package.json');

const env = process.env;
const minimumLibvipsVersionLabelled = env.npm_package_config_libvips || /* istanbul ignore next */
  config.libvips;
const minimumLibvipsVersion = semverCoerce(minimumLibvipsVersionLabelled).version;

const spawnSyncOptions = {
  encoding: 'utf8',
  shell: true
};

const vendorPath = path.join(__dirname, '..', 'vendor', minimumLibvipsVersion, platform());

const mkdirSync = function (dirPath) {
  try {
    fs.mkdirSync(dirPath, { recursive: true });
  } catch (err) {
    /* istanbul ignore next */
    if (err.code !== 'EEXIST') {
      throw err;
    }
  }
};

const cachePath = function () {
  const npmCachePath = env.npm_config_cache || /* istanbul ignore next */
    (env.APPDATA ? path.join(env.APPDATA, 'npm-cache') : path.join(os.homedir(), '.npm'));
  mkdirSync(npmCachePath);
  const libvipsCachePath = path.join(npmCachePath, '_libvips');
  mkdirSync(libvipsCachePath);
  return libvipsCachePath;
};

const integrity = function (platformAndArch) {
  return env[`npm_package_config_integrity_${platformAndArch.replace('-', '_')}`] || config.integrity[platformAndArch];
};

const log = function (item) {
  if (item instanceof Error) {
    console.error(`sharp: Installation error: ${item.message}`);
  } else {
    console.log(`sharp: ${item}`);
  }
};

const isRosetta = function () {
  /* istanbul ignore next */
  log(`Installation info: arch is ${process.arch} & cputype is ${spawnSync('sysctl hw.cputype', spawnSyncOptions).stdout}`);
  if (process.platform === 'darwin' && process.arch === 'x64') {
    const translated = spawnSync('sysctl sysctl.proc_translated', spawnSyncOptions).stdout;
    // here should return false if the machine is Apple M1 chip while node version is darwin x64
    let result = (translated || '').trim() === 'sysctl.proc_translated: 1';
    if (result) {
      // Determine if it is M1 chip even the node is x64
      // see: https://stackoverflow.com/questions/65346260/get-real-architecture-of-m1-mac-regardless-of-rosetta
      const cputype = spawnSync('sysctl hw.cputype', spawnSyncOptions).stdout
      return (cputype || '').trim() !== 'hw.cputype: 16777228';
    }
  }
  return false;
};

const globalLibvipsVersion = function () {
  if (process.platform !== 'win32') {
    const globalLibvipsVersion = spawnSync('pkg-config --modversion vips-cpp', {
      ...spawnSyncOptions,
      env: {
        ...env,
        PKG_CONFIG_PATH: pkgConfigPath()
      }
    }).stdout;
    /* istanbul ignore next */
    return (globalLibvipsVersion || '').trim();
  } else {
    return '';
  }
};

const hasVendoredLibvips = function () {
  return fs.existsSync(vendorPath);
};

/* istanbul ignore next */
const removeVendoredLibvips = function () {
  const rm = fs.rmSync ? fs.rmSync : fs.rmdirSync;
  rm(vendorPath, { recursive: true, maxRetries: 3, force: true });
};

/* istanbul ignore next */
const pkgConfigPath = function () {
  if (process.platform !== 'win32') {
    const brewPkgConfigPath = spawnSync(
      'which brew >/dev/null 2>&1 && brew environment --plain | grep PKG_CONFIG_LIBDIR | cut -d" " -f2',
      spawnSyncOptions
    ).stdout || '';
    return [
      brewPkgConfigPath.trim(),
      env.PKG_CONFIG_PATH,
      '/usr/local/lib/pkgconfig',
      '/usr/lib/pkgconfig',
      '/usr/local/libdata/pkgconfig',
      '/usr/libdata/pkgconfig'
    ].filter(Boolean).join(':');
  } else {
    return '';
  }
};

const useGlobalLibvips = function () {
  if (Boolean(env.SHARP_IGNORE_GLOBAL_LIBVIPS) === true) {
    return false;
  }
  /* istanbul ignore next */
  if (isRosetta()) {
    return false;
  }
  const globalVipsVersion = globalLibvipsVersion();
  return !!globalVipsVersion && /* istanbul ignore next */
    semverGreaterThanOrEqualTo(globalVipsVersion, minimumLibvipsVersion);
};

module.exports = {
  minimumLibvipsVersion,
  minimumLibvipsVersionLabelled,
  cachePath,
  integrity,
  log,
  globalLibvipsVersion,
  hasVendoredLibvips,
  removeVendoredLibvips,
  pkgConfigPath,
  useGlobalLibvips,
  mkdirSync
};
