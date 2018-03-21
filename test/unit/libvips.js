'use strict';

const assert = require('assert');
const semver = require('semver');
const libvips = require('../../lib/libvips');

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
  });
});
