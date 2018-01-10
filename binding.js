'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');

const simpleGet = require('simple-get');
const semver = require('semver');
const tar = require('tar');
const detectLibc = require('detect-libc');

const agent = require('./lib/agent');
const platform = require('./lib/platform');

// Use NPM-provided environment variable where available, falling back to require-based method for Electron
const minimumLibvipsVersion = process.env.npm_package_config_libvips || require('./package.json').config.libvips;

const distBaseUrl = process.env.SHARP_DIST_BASE_URL || `https://github.com/lovell/sharp-libvips/releases/download/v${minimumLibvipsVersion}/`;

// -- Helpers

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

const error = function (msg) {
  if (msg instanceof Error) {
    msg = msg.message;
  }
  process.stderr.write(`sharp: ${msg}\n`);
  process.exit(1);
};

// -- Binary downloaders

module.exports.download_vips = function () {
  // Check for existing vendored binaries and verify platform matches
  const currentPlatformId = platform();
  try {
    const vendorPlatformId = require(path.join(__dirname, 'vendor', 'platform.json'));
    if (currentPlatformId === vendorPlatformId) {
      return;
    } else {
      error(`'${vendorPlatformId}' binaries cannot be used on the '${currentPlatformId}' platform. Please remove the 'node_modules/sharp/vendor' directory and run 'npm install'.`);
    }
  } catch (err) {}
  // Ensure Intel 64-bit or ARM
  const arch = process.env.npm_config_arch || process.arch;
  if (arch === 'ia32') {
    error(`Intel Architecture 32-bit systems require manual installation of libvips >= ${minimumLibvipsVersion} - please see http://sharp.pixelplumbing.com/page/install`);
  }
  // Ensure glibc Linux
  if (detectLibc.isNonGlibcLinux) {
    error(`Use with ${detectLibc.family} libc requires manual installation of libvips >= ${minimumLibvipsVersion} - please see http://sharp.pixelplumbing.com/page/install`);
  }
  // Ensure glibc >= 2.13
  if (detectLibc.family === detectLibc.GLIBC && detectLibc.version && semver.lt(`${detectLibc.version}.0`, '2.13.0')) {
    error(`Use with glibc version ${detectLibc.version} requires manual installation of libvips >= ${minimumLibvipsVersion} - please see http://sharp.pixelplumbing.com/page/install`);
  }
  // Arch/platform-specific .tar.gz
  const tarFilename = ['libvips', minimumLibvipsVersion, currentPlatformId].join('-') + '.tar.gz';
  // Download to per-process temporary file
  const tarPathTemp = path.join(os.tmpdir(), `${process.pid}-${tarFilename}`);
  const tmpFile = fs.createWriteStream(tarPathTemp).on('close', function () {
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
    agent: agent()
  };
  simpleGet(simpleGetOpt, function (err, response) {
    if (err) {
      error(`${url} download failed: ${err.message}`);
    }
    if (response.statusCode !== 200) {
      error(`${url} download failed: status ${response.statusCode}`);
    }
    response.pipe(tmpFile);
  });
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
