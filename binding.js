'use strict';

var fs = require('fs');
var path = require('path');
var zlib = require('zlib');

var semver = require('semver');
var request = require('request');
var tar = require('tar');

var tmp = require('os').tmpdir();

var distBaseUrl = 'https://dl.bintray.com/lovell/sharp/';

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

var unpack = function(tarPath) {
  var extractor = tar.Extract({
    path: __dirname
  });
  extractor.on('error', error);
  extractor.on('end', function() {
    if (!isFile(vipsHeaderPath)) {
      error('Could not unpack ' + tarPath);
    }
  });
  fs.createReadStream(tarPath).on('error', error)
    .pipe(zlib.Unzip())
    .pipe(extractor);
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
    // Ensure 64-bit
    if (process.arch !== 'x64') {
      error('ARM and 32-bit systems require manual installation - please see http://sharp.dimens.io/en/stable/install/');
    }
    // Ensure libc >= 2.15
    var lddVersion = process.env.LDD_VERSION;
    if (lddVersion) {
      var libcVersion = lddVersion ? lddVersion.split(/\n/)[0].split(' ').slice(-1)[0].trim() : '';
      if (libcVersion && semver.lt(libcVersion + '.0', '2.13.0')) {
        error('libc version ' + libcVersion + ' requires manual installation - please see http://sharp.dimens.io/en/stable/install/');
      }
    }
    // Platform-specific .tar.gz
    var tarFilename = ['libvips', process.env.npm_package_config_libvips, process.platform.substr(0, 3)].join('-') + '.tar.gz';
    var tarPath = path.join(__dirname, 'packaging', tarFilename);
    if (isFile(tarPath)) {
      unpack(tarPath);
    } else {
      // Download
      tarPath = path.join(tmp, tarFilename);
      var tmpFile = fs.createWriteStream(tarPath).on('finish', function() {
        unpack(tarPath);
      });
      request(distBaseUrl + tarFilename).on('response', function(response) {
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
      process.env.npm_package_config_libvips
    );
  }
  if (process.platform === 'darwin' && !useGlobalVips) {
    if (globalVipsVersion) {
      error(
        'Found libvips ' + globalVipsVersion + ' but require ' + process.env.npm_package_config_libvips +
        '\nPlease upgrade libvips by running: brew update && brew upgrade'
      );
    } else {
      error('Please install libvips by running: brew install homebrew/science/vips --with-webp --with-graphicsmagick');
    }
  }
  process.stdout.write(useGlobalVips ? 'true' : 'false');
};
