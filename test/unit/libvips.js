// Copyright 2013 Lovell Fuller and others.
// SPDX-License-Identifier: Apache-2.0

'use strict';

const assert = require('assert');
const fs = require('fs');
const semver = require('semver');
const libvips = require('../../lib/libvips');
const mockFS = require('mock-fs');

const originalPlatform = process.platform;

const setPlatform = function (platform) {
  Object.defineProperty(process, 'platform', { value: platform });
};

const restorePlatform = function () {
  setPlatform(originalPlatform);
};

describe('libvips binaries', function () {
  describe('Windows platform', function () {
    before(function () { setPlatform('win32'); });
    after(restorePlatform);

    it('pkgConfigPath returns empty string', function () {
      assert.strictEqual('', libvips.pkgConfigPath());
    });
    it('globalLibvipsVersion returns empty string', function () {
      assert.strictEqual('', libvips.globalLibvipsVersion());
    });
    it('globalLibvipsVersion is always false', function () {
      assert.strictEqual(false, libvips.useGlobalLibvips());
    });
  });

  describe('non-Windows platforms', function () {
    before(function () { setPlatform('linux'); });
    after(restorePlatform);

    it('pkgConfigPath returns a string', function () {
      const pkgConfigPath = libvips.pkgConfigPath();
      assert.strictEqual('string', typeof pkgConfigPath);
    });
    it('globalLibvipsVersion returns a string', function () {
      const globalLibvipsVersion = libvips.globalLibvipsVersion();
      assert.strictEqual('string', typeof globalLibvipsVersion);
    });
    it('globalLibvipsVersion returns a boolean', function () {
      const useGlobalLibvips = libvips.useGlobalLibvips();
      assert.strictEqual('boolean', typeof useGlobalLibvips);
    });
  });

  describe('platform agnostic', function () {
    it('minimumLibvipsVersion returns a valid semver', function () {
      const minimumLibvipsVersion = libvips.minimumLibvipsVersion;
      assert.strictEqual('string', typeof minimumLibvipsVersion);
      assert.notStrictEqual(null, semver.valid(minimumLibvipsVersion));
    });
    it('hasVendoredLibvips returns a boolean', function () {
      const hasVendoredLibvips = libvips.hasVendoredLibvips();
      assert.strictEqual('boolean', typeof hasVendoredLibvips);
    });
    it('useGlobalLibvips can be ignored via an env var', function () {
      process.env.SHARP_IGNORE_GLOBAL_LIBVIPS = 1;

      const useGlobalLibvips = libvips.useGlobalLibvips();
      assert.strictEqual(false, useGlobalLibvips);

      delete process.env.SHARP_IGNORE_GLOBAL_LIBVIPS;
    });
    it('cachePath returns a valid path ending with _libvips', function () {
      const cachePath = libvips.cachePath();
      assert.strictEqual('string', typeof cachePath);
      assert.strictEqual('_libvips', cachePath.substr(-8));
      assert.strictEqual(true, fs.existsSync(cachePath));
    });
  });

  describe('integrity', function () {
    it('reads value from environment variable', function () {
      const prev = process.env.npm_package_config_integrity_platform_arch;
      process.env.npm_package_config_integrity_platform_arch = 'sha512-test';

      const integrity = libvips.integrity('platform-arch');
      assert.strictEqual('sha512-test', integrity);

      process.env.npm_package_config_integrity_platform_arch = prev;
    });
    it('reads value from package.json', function () {
      const prev = process.env.npm_package_config_integrity_linux_x64;
      delete process.env.npm_package_config_integrity_linux_x64;

      const integrity = libvips.integrity('linux-x64');
      assert.strictEqual('sha512-', integrity.substr(0, 7));

      process.env.npm_package_config_integrity_linux_x64 = prev;
    });
  });

  describe('safe directory creation', function () {
    before(function () {
      mockFS({
        exampleDirA: {
          exampleDirB: {
            exampleFile: 'Example test file'
          }
        }
      });
    });
    after(function () { mockFS.restore(); });

    it('mkdirSync creates a directory', function () {
      const dirPath = 'createdDir';

      libvips.mkdirSync(dirPath);
      assert.strictEqual(true, fs.existsSync(dirPath));
    });
    it('mkdirSync does not throw error or overwrite an existing dir', function () {
      const dirPath = 'exampleDirA';
      const nestedDirPath = 'exampleDirA/exampleDirB';
      assert.strictEqual(true, fs.existsSync(dirPath));

      libvips.mkdirSync(dirPath);

      assert.strictEqual(true, fs.existsSync(dirPath));
      assert.strictEqual(true, fs.existsSync(nestedDirPath));
    });
  });

  describe('logger', function () {
    const consoleLog = console.log;
    const consoleError = console.error;

    after(function () {
      console.log = consoleLog;
      console.error = consoleError;
    });

    it('logs an info message', function (done) {
      console.log = function (msg) {
        assert.strictEqual(msg, 'sharp: progress');
        done();
      };
      libvips.log('progress');
    });

    it('logs an error message', function (done) {
      console.error = function (msg) {
        assert.strictEqual(msg, 'sharp: Installation error: problem');
        done();
      };
      libvips.log(new Error('problem'));
    });
  });
});
