'use strict';

const path = require('path');
const spawnSync = require('child_process').spawnSync;
const semver = require('semver');
const platform = require('./platform');

const minimumLibvipsVersion = process.env.npm_package_config_libvips || require('../package.json').config.libvips;

const spawnSyncOptions = {
  encoding: 'utf8',
  shell: true
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
  try {
    const vendorPlatformId = require(path.join(__dirname, '..', 'vendor', 'platform.json'));
    if (currentPlatformId === vendorPlatformId) {
      return true;
    } else {
      throw new Error(`'${vendorPlatformId}' binaries cannot be used on the '${currentPlatformId}' platform. Please remove the 'node_modules/sharp/vendor' directory and run 'npm install'.`);
    }
  } catch (err) {}
  return false;
};

const pkgConfigPath = function () {
  if (process.platform !== 'win32') {
    const brewPkgConfigPath = spawnSync('which brew >/dev/null 2>&1 && eval $(brew --env) && echo $PKG_CONFIG_LIBDIR', spawnSyncOptions).stdout || '';
    return [brewPkgConfigPath.trim(), process.env.PKG_CONFIG_PATH, '/usr/local/lib/pkgconfig', '/usr/lib/pkgconfig']
      .filter(function (p) { return !!p; })
      .join(':');
  } else {
    return '';
  }
};

const useGlobalLibvips = function () {
  const globalVipsVersion = globalLibvipsVersion();
  return !!globalVipsVersion && semver.gte(globalVipsVersion, minimumLibvipsVersion);
};

module.exports = {
  minimumLibvipsVersion: minimumLibvipsVersion,
  globalLibvipsVersion: globalLibvipsVersion,
  hasVendoredLibvips: hasVendoredLibvips,
  pkgConfigPath: pkgConfigPath,
  useGlobalLibvips: useGlobalLibvips
};
