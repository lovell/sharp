// Copyright 2013 Lovell Fuller and others.
// SPDX-License-Identifier: Apache-2.0

'use strict';

const assert = require('assert');
const fs = require('fs');
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
    it('useGlobalLibvips can be ignored via an env var', function () {
      process.env.SHARP_IGNORE_GLOBAL_LIBVIPS = 1;

      const useGlobalLibvips = libvips.useGlobalLibvips();
      assert.strictEqual(false, useGlobalLibvips);

      delete process.env.SHARP_IGNORE_GLOBAL_LIBVIPS;
    });
  });

  describe('Build time platform detection', () => {
    it('Can override platform with npm_config_platform and npm_config_libc', function () {
      process.env.npm_config_platform = 'testplatform';
      process.env.npm_config_libc = 'testlibc';
      const platformArch = libvips.buildPlatformArch();
      if (platformArch === 'wasm32') {
        return this.skip();
      }
      const [platform] = platformArch.split('-');
      assert.strictEqual(platform, 'testplatformtestlibc');
      delete process.env.npm_config_platform;
      delete process.env.npm_config_libc;
    });
    it('Can override arch with npm_config_arch', function () {
      process.env.npm_config_arch = 'test';
      const platformArch = libvips.buildPlatformArch();
      if (platformArch === 'wasm32') {
        return this.skip();
      }
      const [, arch] = platformArch.split('-');
      assert.strictEqual(arch, 'test');
      delete process.env.npm_config_arch;
    });
  });

  describe('Build time directories', () => {
    it('sharp-libvips include', () => {
      const dir = libvips.buildSharpLibvipsIncludeDir();
      assert.strictEqual(fs.statSync(dir).isDirectory(), true);
    });
    it('sharp-libvips cplusplus', () => {
      const dir = libvips.buildSharpLibvipsCPlusPlusDir();
      assert.strictEqual(fs.statSync(dir).isDirectory(), true);
    });
    it('sharp-libvips lib', () => {
      const dir = libvips.buildSharpLibvipsLibDir();
      assert.strictEqual(fs.statSync(dir).isDirectory(), true);
    });
  });

  describe('Runtime detection', () => {
    it('platform', () => {
      const [platform] = libvips.runtimePlatformArch().split('-');
      assert.strict(['darwin', 'linux', 'linuxmusl', 'win32'].includes(platform));
    });
    it('arch', () => {
      const [, arch] = libvips.runtimePlatformArch().split('-');
      assert.strict(['arm', 'arm64', 'ia32', 'x64'].includes(arch));
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

  it('yarn locator hash', () => {
    const locatorHash = libvips.yarnLocator();
    if (locatorHash.length) {
      assert.strict(locatorHash.length, 10);
      assert.strict(/[a-f0-9]{10}/.test(locatorHash));
    }
  });
});
