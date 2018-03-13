'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');

const detectLibc = require('detect-libc');
const npmLog = require('npmlog');
const semver = require('semver');
const simpleGet = require('simple-get');
const tar = require('tar');

const agent = require('../lib/agent');
const libvips = require('../lib/libvips');
const platform = require('../lib/platform');

const minimumLibvipsVersion = libvips.minimumLibvipsVersion;
const distBaseUrl = process.env.SHARP_DIST_BASE_URL || `https://github.com/lovell/sharp-libvips/releases/download/v${minimumLibvipsVersion}/`;

try {
  const useGlobalLibvips = libvips.useGlobalLibvips();
  if (useGlobalLibvips) {
    const globalLibvipsVersion = libvips.globalLibvipsVersion();
    npmLog.info('sharp', `Detected globally-installed libvips v${globalLibvipsVersion}`);
    npmLog.info('sharp', 'Building from source via node-gyp');
    process.exit(1);
  } else if (libvips.hasVendoredLibvips()) {
    npmLog.info('sharp', `Using existing vendored libvips v${minimumLibvipsVersion}`);
  } else {
    // Is this arch/platform supported?
    const arch = process.env.npm_config_arch || process.arch;
    if (arch === 'ia32') {
      throw new Error(`Intel Architecture 32-bit systems require manual installation of libvips >= ${minimumLibvipsVersion}\n`);
    }
    if (detectLibc.isNonGlibcLinux) {
      throw new Error(`Use with ${detectLibc.family} libc requires manual installation of libvips >= ${minimumLibvipsVersion}`);
    }
    if (detectLibc.family === detectLibc.GLIBC && detectLibc.version && semver.lt(`${detectLibc.version}.0`, '2.13.0')) {
      throw new Error(`Use with glibc version ${detectLibc.version} requires manual installation of libvips >= ${minimumLibvipsVersion}`);
    }
    // Download to per-process temporary file
    const tarFilename = ['libvips', minimumLibvipsVersion, platform()].join('-') + '.tar.gz';
    const tarPathTemp = path.join(os.tmpdir(), `${process.pid}-${tarFilename}`);
    const tmpFile = fs.createWriteStream(tarPathTemp);
    const url = distBaseUrl + tarFilename;
    npmLog.info('sharp', `Downloading ${url}`);
    simpleGet({ url: url, agent: agent() }, function (err, response) {
      if (err) {
        throw err;
      }
      if (response.statusCode !== 200) {
        throw new Error(`Status ${response.statusCode}`);
      }
      response.pipe(tmpFile);
    });
    tmpFile.on('close', function () {
      const vendorPath = path.join(__dirname, '..', 'vendor');
      fs.mkdirSync(vendorPath);
      tar
        .extract({
          file: tarPathTemp,
          cwd: vendorPath,
          strict: true
        })
        .then(function () {
          try {
            fs.unlinkSync(tarPathTemp);
          } catch (err) {}
        })
        .catch(function (err) {
          throw err;
        });
    });
  }
} catch (err) {
  npmLog.error('sharp', err.message);
  npmLog.error('sharp', 'Please see http://sharp.pixelplumbing.com/page/install');
  process.exit(1);
}
