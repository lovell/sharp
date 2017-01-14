'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const zlib = require('zlib');

const caw = require('caw');
const got = require('got');
const semver = require('semver');
const tar = require('tar');

const distBaseUrl = 'https://dl.bintray.com/lovell/sharp/';

// Use NPM-provided environment variable where available, falling back to require-based method for Electron
const minimumLibvipsVersion = process.env.npm_package_config_libvips || require('./package.json').config.libvips;

const platform = process.env.npm_config_platform || process.platform;

const arch = process.env.npm_config_arch || process.arch;

// -- Helpers

// Does this file exist?
const isFile = function (file) {
  try {
    return fs.statSync(file).isFile();
  } catch (err) {}
};

const unpack = function (tarPath, done) {
  const extractor = tar.Extract({ path: path.join(__dirname, 'vendor') });
  if (done) {
    extractor.on('end', done);
  }
  extractor.on('error', error);
  fs.createReadStream(tarPath)
    .on('error', error)
    .pipe(zlib.Unzip())
    .pipe(extractor);
};

const platformId = function () {
  const platformId = [platform];
  if (arch === 'arm' || arch === 'armhf' || arch === 'arch64') {
    const armVersion = (arch === 'arch64') ? '8' : process.env.npm_config_armv || process.config.variables.arm_version || '6';
    platformId.push('armv' + armVersion);
  } else {
    platformId.push(arch);
  }
  return platformId.join('-');
};

// Error
const error = function (msg) {
  if (msg instanceof Error) {
    msg = msg.message;
  }
  process.stderr.write('ERROR: ' + msg + '\n');
  process.exit(1);
};

// -- Binary downloaders

module.exports.download_vips = function () {
  // Has vips been installed locally?
  const vipsHeaderPath = path.join(__dirname, 'vendor', 'include', 'vips', 'vips.h');
  if (!isFile(vipsHeaderPath)) {
    // Ensure Intel 64-bit or ARM
    if (arch === 'ia32') {
      error('Intel Architecture 32-bit systems require manual installation - please see http://sharp.dimens.io/en/stable/install/');
    }
    // Ensure glibc >= 2.15
    const lddVersion = process.env.LDD_VERSION;
    if (lddVersion) {
      if (/(glibc|gnu libc)/i.test(lddVersion)) {
        const glibcVersion = lddVersion ? lddVersion.split(/\n/)[0].split(' ').slice(-1)[0].trim() : '';
        if (glibcVersion && semver.lt(glibcVersion + '.0', '2.13.0')) {
          error('glibc version ' + glibcVersion + ' requires manual installation - please see http://sharp.dimens.io/en/stable/install/');
        }
      } else {
        error(lddVersion.split(/\n/)[0] + ' requires manual installation - please see http://sharp.dimens.io/en/stable/install/');
      }
    }
    // Arch/platform-specific .tar.gz
    const tarFilename = ['libvips', minimumLibvipsVersion, platformId()].join('-') + '.tar.gz';
    const tarPathLocal = path.join(__dirname, 'packaging', tarFilename);
    if (isFile(tarPathLocal)) {
      unpack(tarPathLocal);
    } else {
      // Download to per-process temporary file
      const tarPathTemp = path.join(os.tmpdir(), process.pid + '-' + tarFilename);
      const tmpFile = fs.createWriteStream(tarPathTemp).on('finish', function () {
        unpack(tarPathTemp, function () {
          // Attempt to remove temporary file
          try {
            fs.unlinkSync(tarPathTemp);
          } catch (err) {}
        });
      });
      const gotOpt = {
        agent: caw(null, {
          protocol: 'https'
        })
      };
      const url = distBaseUrl + tarFilename;
      got.stream(url, gotOpt).on('response', function (response) {
        if (response.statusCode !== 200) {
          error(url + ' status code ' + response.statusCode);
        }
      }).on('error', function (err) {
        error('Download of ' + url + ' failed: ' + err.message);
      }).pipe(tmpFile);
    }
  }
};

module.exports.use_global_vips = function () {
  const globalVipsVersion = process.env.GLOBAL_VIPS_VERSION;
  if (globalVipsVersion) {
    const useGlobalVips = semver.gte(
      globalVipsVersion,
      minimumLibvipsVersion
    );
    process.stdout.write(useGlobalVips ? 'true' : 'false');
  } else {
    process.stdout.write('false');
  }
};
