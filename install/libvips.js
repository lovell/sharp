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

const minimumGlibcVersionByArch = {
  arm: '2.28',
  arm64: '2.29',
  x64: '2.17'
};

const { minimumLibvipsVersion, minimumLibvipsVersionLabelled } = libvips;
const distBaseUrl = process.env.npm_config_sharp_dist_base_url || process.env.SHARP_DIST_BASE_URL || `https://github.com/lovell/sharp-libvips/releases/download/v${minimumLibvipsVersionLabelled}/`;

const fail = function (err) {
  npmLog.error('sharp', err.message);
  if (err.code === 'EACCES') {
    npmLog.info('sharp', 'Are you trying to install as a root or sudo user? Try again with the --unsafe-perm flag');
  }
  npmLog.info('sharp', 'Attempting to build from source via node-gyp but this may fail due to the above error');
  npmLog.info('sharp', 'Please see https://sharp.pixelplumbing.com/install for required dependencies');
  process.exit(1);
};

const extractTarball = function (tarPath) {
  const vendorPath = path.join(__dirname, '..', 'vendor');
  libvips.mkdirSync(vendorPath);
  tar
    .extract({
      file: tarPath,
      cwd: vendorPath,
      strict: true
    })
    .catch(function (err) {
      if (/unexpected end of file/.test(err.message)) {
        npmLog.error('sharp', `Please delete ${tarPath} as it is not a valid tarball`);
      }
      fail(err);
    });
};

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
    const platformAndArch = platform();
    if (arch === 'ia32' && !platformAndArch.startsWith('win32')) {
      throw new Error(`Intel Architecture 32-bit systems require manual installation of libvips >= ${minimumLibvipsVersion}`);
    }
    if (platformAndArch === 'freebsd-x64' || platformAndArch === 'openbsd-x64' || platformAndArch === 'sunos-x64') {
      throw new Error(`BSD/SunOS systems require manual installation of libvips >= ${minimumLibvipsVersion}`);
    }
    if (detectLibc.family === detectLibc.GLIBC && detectLibc.version) {
      if (semver.lt(`${detectLibc.version}.0`, `${minimumGlibcVersionByArch[arch]}.0`)) {
        throw new Error(`Use with glibc ${detectLibc.version} requires manual installation of libvips >= ${minimumLibvipsVersion}`);
      }
    }
    // Download to per-process temporary file
    const tarFilename = ['libvips', minimumLibvipsVersion, platformAndArch].join('-') + '.tar.gz';
    const tarPathCache = path.join(libvips.cachePath(), tarFilename);
    if (fs.existsSync(tarPathCache)) {
      npmLog.info('sharp', `Using cached ${tarPathCache}`);
      extractTarball(tarPathCache);
    } else {
      const tarPathTemp = path.join(os.tmpdir(), `${process.pid}-${tarFilename}`);
      const tmpFile = fs.createWriteStream(tarPathTemp);
      const url = distBaseUrl + tarFilename;
      npmLog.info('sharp', `Downloading ${url}`);
      simpleGet({ url: url, agent: agent() }, function (err, response) {
        if (err) {
          fail(err);
        } else if (response.statusCode === 404) {
          fail(new Error(`Prebuilt libvips ${minimumLibvipsVersion} binaries are not yet available for ${platformAndArch}`));
        } else if (response.statusCode !== 200) {
          fail(new Error(`Status ${response.statusCode} ${response.statusMessage}`));
        } else {
          response
            .on('error', fail)
            .pipe(tmpFile);
        }
      });
      tmpFile
        .on('error', fail)
        .on('close', function () {
          try {
            // Attempt to rename
            fs.renameSync(tarPathTemp, tarPathCache);
          } catch (err) {
            // Fall back to copy and unlink
            fs.copyFileSync(tarPathTemp, tarPathCache);
            fs.unlinkSync(tarPathTemp);
          }
          extractTarball(tarPathCache);
        });
    }
  }
} catch (err) {
  fail(err);
}
