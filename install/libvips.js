'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const stream = require('stream');
const zlib = require('zlib');

const detectLibc = require('detect-libc');
const semver = require('semver');
const simpleGet = require('simple-get');
const tarFs = require('tar-fs');

const agent = require('../lib/agent');
const libvips = require('../lib/libvips');
const platform = require('../lib/platform');

const minimumGlibcVersionByArch = {
  arm: '2.28',
  arm64: '2.29',
  x64: '2.17'
};

const hasSharpPrebuild = [
  'darwin-x64',
  'linux-arm64',
  'linux-x64',
  'linuxmusl-x64',
  'linuxmusl-arm64',
  'win32-ia32',
  'win32-x64'
];

const { minimumLibvipsVersion, minimumLibvipsVersionLabelled } = libvips;
const distHost = process.env.npm_config_sharp_libvips_binary_host || 'https://github.com/lovell/sharp-libvips/releases/download';
const distBaseUrl = process.env.npm_config_sharp_dist_base_url || process.env.SHARP_DIST_BASE_URL || `${distHost}/v${minimumLibvipsVersionLabelled}/`;
const supportsBrotli = ('BrotliDecompress' in zlib);

const fail = function (err) {
  libvips.log(err);
  if (err.code === 'EACCES') {
    libvips.log('Are you trying to install as a root or sudo user? Try again with the --unsafe-perm flag');
  }
  libvips.log('Attempting to build from source via node-gyp but this may fail due to the above error');
  libvips.log('Please see https://sharp.pixelplumbing.com/install for required dependencies');
  process.exit(1);
};

const extractTarball = function (tarPath, platformAndArch) {
  const vendorPath = path.join(__dirname, '..', 'vendor');
  libvips.mkdirSync(vendorPath);
  const versionedVendorPath = path.join(vendorPath, minimumLibvipsVersion);
  libvips.mkdirSync(versionedVendorPath);

  const ignoreVendorInclude = hasSharpPrebuild.includes(platformAndArch) && !process.env.npm_config_build_from_source;
  const ignore = function (name) {
    return ignoreVendorInclude && name.includes('include/');
  };

  stream.pipeline(
    fs.createReadStream(tarPath),
    supportsBrotli ? new zlib.BrotliDecompress() : new zlib.Gunzip(),
    tarFs.extract(versionedVendorPath, { ignore }),
    function (err) {
      if (err) {
        if (/unexpected end of file/.test(err.message)) {
          fail(new Error(`Please delete ${tarPath} as it is not a valid tarball`));
        }
        fail(err);
      }
    }
  );
};

try {
  const useGlobalLibvips = libvips.useGlobalLibvips();

  if (useGlobalLibvips) {
    const globalLibvipsVersion = libvips.globalLibvipsVersion();
    libvips.log(`Detected globally-installed libvips v${globalLibvipsVersion}`);
    libvips.log('Building from source via node-gyp');
    process.exit(1);
  } else if (libvips.hasVendoredLibvips()) {
    libvips.log(`Using existing vendored libvips v${minimumLibvipsVersion}`);
  } else {
    // Is this arch/platform supported?
    const arch = process.env.npm_config_arch || process.arch;
    const platformAndArch = platform();
    if (arch === 'ia32' && !platformAndArch.startsWith('win32')) {
      throw new Error(`Intel Architecture 32-bit systems require manual installation of libvips >= ${minimumLibvipsVersion}`);
    }
    if (platformAndArch === 'darwin-arm64') {
      throw new Error("Please run 'brew install vips' to install libvips on Apple M1 (ARM64) systems");
    }
    if (platformAndArch === 'freebsd-x64' || platformAndArch === 'openbsd-x64' || platformAndArch === 'sunos-x64') {
      throw new Error(`BSD/SunOS systems require manual installation of libvips >= ${minimumLibvipsVersion}`);
    }
    if (detectLibc.family === detectLibc.GLIBC && detectLibc.version) {
      if (semver.lt(`${detectLibc.version}.0`, `${minimumGlibcVersionByArch[arch]}.0`)) {
        throw new Error(`Use with glibc ${detectLibc.version} requires manual installation of libvips >= ${minimumLibvipsVersion}`);
      }
    }
    if (detectLibc.family === detectLibc.MUSL && detectLibc.version) {
      if (semver.lt(detectLibc.version, '1.1.24')) {
        throw new Error(`Use with musl ${detectLibc.version} requires manual installation of libvips >= ${minimumLibvipsVersion}`);
      }
    }

    const supportedNodeVersion = process.env.npm_package_engines_node || require('../package.json').engines.node;
    if (!semver.satisfies(process.versions.node, supportedNodeVersion)) {
      throw new Error(`Expected Node.js version ${supportedNodeVersion} but found ${process.versions.node}`);
    }

    const extension = supportsBrotli ? 'br' : 'gz';

    // Download to per-process temporary file
    const tarFilename = ['libvips', minimumLibvipsVersion, platformAndArch].join('-') + '.tar.' + extension;
    const tarPathCache = path.join(libvips.cachePath(), tarFilename);
    if (fs.existsSync(tarPathCache)) {
      libvips.log(`Using cached ${tarPathCache}`);
      extractTarball(tarPathCache, platformAndArch);
    } else {
      const url = distBaseUrl + tarFilename;
      libvips.log(`Downloading ${url}`);
      simpleGet({ url: url, agent: agent() }, function (err, response) {
        if (err) {
          fail(err);
        } else if (response.statusCode === 404) {
          fail(new Error(`Prebuilt libvips ${minimumLibvipsVersion} binaries are not yet available for ${platformAndArch}`));
        } else if (response.statusCode !== 200) {
          fail(new Error(`Status ${response.statusCode} ${response.statusMessage}`));
        } else {
          const tarPathTemp = path.join(os.tmpdir(), `${process.pid}-${tarFilename}`);
          const tmpFileStream = fs.createWriteStream(tarPathTemp);
          response
            .on('error', function (err) {
              tmpFileStream.destroy(err);
            })
            .on('close', function () {
              if (!response.complete) {
                tmpFileStream.destroy(new Error('Download incomplete (connection was terminated)'));
              }
            })
            .pipe(tmpFileStream);
          tmpFileStream
            .on('error', function (err) {
              // Clean up temporary file
              try {
                fs.unlinkSync(tarPathTemp);
              } catch (e) {}
              fail(err);
            })
            .on('close', function () {
              try {
                // Attempt to rename
                fs.renameSync(tarPathTemp, tarPathCache);
              } catch (err) {
                // Fall back to copy and unlink
                fs.copyFileSync(tarPathTemp, tarPathCache);
                fs.unlinkSync(tarPathTemp);
              }
              extractTarball(tarPathCache, platformAndArch);
            });
        }
      });
    }
  }
} catch (err) {
  fail(err);
}
