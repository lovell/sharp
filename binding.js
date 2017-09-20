'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');

const caw = require('caw');
const simpleGet = require('simple-get');
const semver = require('semver');
const tar = require('tar');
const detectLibc = require('detect-libc');

const distBaseUrl = process.env.SHARP_DIST_BASE_URL || 'https://dl.bintray.com/lovell/sharp/';

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
  const vendorPath = path.join(__dirname, 'vendor');
  fs.mkdirSync(vendorPath);
  tar
    .extract({
      file: tarPath,
      cwd: vendorPath,
      strict: true
    })
    .then(done)
    .catch(error);
};

const platformId = function () {
  const platformId = [platform];
  if (arch === 'arm' || arch === 'armhf' || arch === 'arm64') {
    const armVersion = (arch === 'arm64') ? '8' : process.env.npm_config_armv || process.config.variables.arm_version || '6';
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
      error('Intel Architecture 32-bit systems require manual installation of libvips - please see http://sharp.dimens.io/page/install');
    }
    // Ensure glibc Linux
    if (detectLibc.isNonGlibcLinux) {
      error(`Use with ${detectLibc.family} libc requires manual installation of libvips - please see http://sharp.dimens.io/page/install`);
    }
    // Ensure glibc >= 2.13
    if (detectLibc.family === detectLibc.GLIBC && detectLibc.version && semver.lt(`${detectLibc.version}.0`, '2.13.0')) {
      error(`Use with glibc version ${detectLibc.version} requires manual installation of libvips - please see http://sharp.dimens.io/page/install`);
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
      const url = distBaseUrl + tarFilename;
      const simpleGetOpt = {
        url: url,
        agent: caw(null, {
          protocol: 'https'
        })
      };
      simpleGet(simpleGetOpt, function (err, response) {
        if (err) {
          error('Download of ' + url + ' failed: ' + err.message);
        }
        if (response.statusCode !== 200) {
          error(url + ' status code ' + response.statusCode);
        }
        response.pipe(tmpFile);
      });
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
