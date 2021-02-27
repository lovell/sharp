'use strict';

const fs = require('fs');
const path = require('path');

const libvips = require('../lib/libvips');

const minimumLibvipsVersion = libvips.minimumLibvipsVersion;

const platform = process.env.npm_config_platform || process.platform;
if (platform === 'win32') {
  const buildDir = path.join(__dirname, '..', 'build');
  const buildReleaseDir = path.join(buildDir, 'Release');
  libvips.log(`Creating ${buildReleaseDir}`);
  try {
    libvips.mkdirSync(buildDir);
    libvips.mkdirSync(buildReleaseDir);
  } catch (err) {}
  const vendorLibDir = path.join(__dirname, '..', 'vendor', minimumLibvipsVersion, 'lib');
  libvips.log(`Copying DLLs from ${vendorLibDir} to ${buildReleaseDir}`);
  try {
    fs
      .readdirSync(vendorLibDir)
      .filter(function (filename) {
        return /\.dll$/.test(filename);
      })
      .forEach(function (filename) {
        fs.copyFileSync(
          path.join(vendorLibDir, filename),
          path.join(buildReleaseDir, filename)
        );
      });
  } catch (err) {
    libvips.log(err);
    process.exit(1);
  }
}
