'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const spawnSync = require('child_process').spawnSync;
const semver = require('semver');
const platform = require('./platform');

const env = process.env;
const minimumLibvipsVersion = env.npm_package_config_libvips || require('../package.json').config.libvips;

const spawnSyncOptions = {
  encoding: 'utf8',
  shell: true
};

const cachePath = function () {
  const npmCachePath = env.npm_config_cache || (env.APPDATA ? path.join(env.APPDATA, 'npm-cache') : path.join(os.homedir(), '.npm'));
  try {
    fs.mkdirSync(npmCachePath);
  } catch (err) {
    if (err.code !== 'EEXIST') {
      throw err;
    }
  }
  const libvipsCachePath = path.join(npmCachePath, '_libvips');
  try {
    fs.mkdirSync(libvipsCachePath);
  } catch (err) {
    if (err.code !== 'EEXIST') {
      throw err;
    }
  }
  return libvipsCachePath;
};

const globalLibvipsVersion = function () {
  if (process.platform !== 'win32') {
    const globalLibvipsVersion = spawnSync(`PKG_CONFIG_PATH="${pkgConfigPath()}" pkg-config --modversion vips-cpp`, spawnSyncOptions).stdout || '';
    return globalLibvipsVersion.trim();
  } else {
    return '';
  }
};

const hasVendoredLibvips = function () {
  const currentPlatformId = platform();
  let vendorPlatformId;
  try {
    vendorPlatformId = require(path.join(__dirname, '..', 'vendor', 'platform.json'));
  } catch (err) {}
  if (vendorPlatformId) {
    if (currentPlatformId === vendorPlatformId) {
      return true;
    } else {
      throw new Error(`'${vendorPlatformId}' binaries cannot be used on the '${currentPlatformId}' platform. Please remove the 'node_modules/sharp/vendor' directory and run 'npm install'.`);
    }
  }
  return false;
};

const pkgConfigPath = function () {
  if (process.platform !== 'win32') {
    const brewPkgConfigPath = spawnSync('which brew >/dev/null 2>&1 && eval $(brew --env) && echo $PKG_CONFIG_LIBDIR', spawnSyncOptions).stdout || '';
    return [brewPkgConfigPath.trim(), env.PKG_CONFIG_PATH, '/usr/local/lib/pkgconfig', '/usr/lib/pkgconfig']
      .filter(function (p) { return !!p; })
      .join(':');
  } else {
    return '';
  }
};

const useGlobalLibvips = function () {
  if (Boolean(env.SHARP_IGNORE_GLOBAL_LIBVIPS) === true) {
    return false;
  }

  const globalVipsVersion = globalLibvipsVersion();
  return !!globalVipsVersion && semver.gte(globalVipsVersion, minimumLibvipsVersion);
};

module.exports = {
  minimumLibvipsVersion: minimumLibvipsVersion,
  cachePath: cachePath,
  globalLibvipsVersion: globalLibvipsVersion,
  hasVendoredLibvips: hasVendoredLibvips,
  pkgConfigPath: pkgConfigPath,
  useGlobalLibvips: useGlobalLibvips
};
