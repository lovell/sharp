'use strict';

var fs = require('fs');
var path = require('path');
var zlib = require('zlib');

var semver = require('semver');
var request = require('request');
var tar = require('tar');

var tmp = require('os').tmpdir();

var distBaseUrl = 'https://dl.bintray.com/lovell/sharp/';

// Use NPM-provided environment variable where available, falling back to require-based method for Electron
var minimumLibvipsVersion = process.env.npm_package_config_libvips || require('./package.json').config.libvips;

var vipsHeaderPath = path.join(__dirname, 'include', 'vips', 'vips.h');

// -- Helpers

// Does this file exist?
var isFile = function(file) {
  var exists = false;
  try {
    exists = fs.statSync(file).isFile();
  } catch (err) {}
  return exists;
};

var unpack = function(tarPath, done) {
  var extractor = tar.Extract({
    path: __dirname
  });
  extractor.on('error', error);
  extractor.on('end', function() {
    if (!isFile(vipsHeaderPath)) {
      error('Could not unpack ' + tarPath);
    }
    if (typeof done === 'function') {
      done();
    }
  });
  fs.createReadStream(tarPath).on('error', error)
    .pipe(zlib.Unzip())
    .pipe(extractor);
};

var platformId = function() {
  var id = [process.platform, process.arch].join('-');
  if (process.arch === 'arm') {
    switch(process.config.variables.arm_version) {
      case '8':
        id = id + 'v8';
        break;
      case '7':
        id = id + 'v7';
        break;
      default:
        id = id + 'v6';
        break;
    }
  }
  return id;
};

// Error
var error = function(msg) {
  if (msg instanceof Error) {
    msg = msg.message;
  }
  process.stderr.write('ERROR: ' + msg + '\n');
  process.exit(1);
};

// -- Binary downloaders

module.exports.download_vips = function() {
  // Has vips been installed locally?
  if (!isFile(vipsHeaderPath)) {
    // Ensure Intel 64-bit or ARM
    if (process.arch === 'ia32') {
      error('Intel Architecture 32-bit systems require manual installation - please see http://sharp.dimens.io/en/stable/install/');
    }
    // Ensure glibc >= 2.15
    var lddVersion = process.env.LDD_VERSION;
    if (lddVersion) {
      if (/(glibc|gnu libc)/i.test(lddVersion)) {
        var glibcVersion = lddVersion ? lddVersion.split(/\n/)[0].split(' ').slice(-1)[0].trim() : '';
        if (glibcVersion && semver.lt(glibcVersion + '.0', '2.13.0')) {
          error('glibc version ' + glibcVersion + ' requires manual installation - please see http://sharp.dimens.io/en/stable/install/');
        }
      } else {
        error(lddVersion.split(/\n/)[0] + ' requires manual installation - please see http://sharp.dimens.io/en/stable/install/');
      }
    }
    // Arch/platform-specific .tar.gz
    var tarFilename = ['libvips', minimumLibvipsVersion, platformId()].join('-') + '.tar.gz';
    var tarPath = path.join(__dirname, 'packaging', tarFilename);
    if (isFile(tarPath)) {
      unpack(tarPath);
    } else {
      // Download to per-process temporary file
      tarPath = path.join(tmp, process.pid + '-' + tarFilename);
      var tmpFile = fs.createWriteStream(tarPath).on('finish', function() {
        unpack(tarPath, function() {
          // Attempt to remove temporary file
          try {
            fs.unlinkSync(tarPath);
          } catch (err) {}
        });
      });
      var options = {
        url: distBaseUrl + tarFilename
      };
      if (process.env.npm_config_https_proxy) {
        // Use the NPM-configured HTTPS proxy
        options.proxy = process.env.npm_config_https_proxy;
      }
      request(options).on('response', function(response) {
        if (response.statusCode !== 200) {
          error(distBaseUrl + tarFilename + ' status code ' + response.statusCode);
        }
      }).on('error', function(err) {
        error('Download from ' + distBaseUrl + tarFilename + ' failed: ' + err.message);
      }).pipe(tmpFile);
    }
  }
};

module.exports.use_global_vips = function() {
  var useGlobalVips = false;
  var globalVipsVersion = process.env.GLOBAL_VIPS_VERSION;
  if (globalVipsVersion) {
    useGlobalVips = semver.gte(
      globalVipsVersion,
      minimumLibvipsVersion
    );
  }
  process.stdout.write(useGlobalVips ? 'true' : 'false');
};
