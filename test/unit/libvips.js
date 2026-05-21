/*!
  Copyright 2013 Lovell Fuller and others.
  SPDX-License-Identifier: Apache-2.0
*/

const fs = require('node:fs/promises');
const { after, before, suite, test } = require('node:test');

const semver = require('semver');
const libvips = require('../../dist/libvips.cjs');

const originalPlatform = process.platform;

const setPlatform = (platform) => {
  Object.defineProperty(process, 'platform', { value: platform });
};

const restorePlatform = () => {
  setPlatform(originalPlatform);
};

suite('libvips binaries', () => {
  suite('Windows platform', () => {
    before(() => { setPlatform('win32'); });
    after(restorePlatform);

    test('pkgConfigPath returns empty string', (t) => {
      t.plan(1);
      t.assert.strictEqual('', libvips.pkgConfigPath());
    });
    test('globalLibvipsVersion returns empty string', (t) => {
      t.plan(1);
      t.assert.strictEqual('', libvips.globalLibvipsVersion());
    });
    test('globalLibvipsVersion is always false', (t) => {
      t.plan(1);
      t.assert.strictEqual(false, libvips.useGlobalLibvips());
    });
  });

  suite('non-Windows platforms', () => {
    before(() => { setPlatform('linux'); });
    after(restorePlatform);

    test('pkgConfigPath returns a string', (t) => {
      t.plan(1);
      const pkgConfigPath = libvips.pkgConfigPath();
      t.assert.strictEqual('string', typeof pkgConfigPath);
    });
    test('globalLibvipsVersion returns a string', (t) => {
      t.plan(1);
      const globalLibvipsVersion = libvips.globalLibvipsVersion();
      t.assert.strictEqual('string', typeof globalLibvipsVersion);
    });
    test('globalLibvipsVersion returns a boolean', (t) => {
      t.plan(1);
      const useGlobalLibvips = libvips.useGlobalLibvips();
      t.assert.strictEqual('boolean', typeof useGlobalLibvips);
    });
  });

  suite('platform agnostic', () => {
    test('minimumLibvipsVersion returns a valid semver', (t) => {
      t.plan(2);
      const minimumLibvipsVersion = libvips.minimumLibvipsVersion;
      t.assert.strictEqual('string', typeof minimumLibvipsVersion);
      t.assert.notStrictEqual(null, semver.valid(minimumLibvipsVersion));
    });
    test('useGlobalLibvips can be ignored via an env var', (t) => {
      t.plan(1);
      process.env.SHARP_IGNORE_GLOBAL_LIBVIPS = 1;

      const useGlobalLibvips = libvips.useGlobalLibvips();
      t.assert.strictEqual(false, useGlobalLibvips);

      delete process.env.SHARP_IGNORE_GLOBAL_LIBVIPS;
    });
    test('useGlobalLibvips can be forced via an env var', (t) => {
      t.plan(4);
      process.env.SHARP_FORCE_GLOBAL_LIBVIPS = 1;

      const useGlobalLibvips = libvips.useGlobalLibvips();
      t.assert.strictEqual(true, useGlobalLibvips);

      let logged = false;
      const logger = (message) => {
        t.assert.strictEqual(message, 'Detected SHARP_FORCE_GLOBAL_LIBVIPS, skipping search for globally-installed libvips');
        logged = true;
      };
      const useGlobalLibvipsWithLogger = libvips.useGlobalLibvips(logger);
      t.assert.strictEqual(true, useGlobalLibvipsWithLogger);
      t.assert.strictEqual(true, logged);

      delete process.env.SHARP_FORCE_GLOBAL_LIBVIPS;
    });
  });

  suite('Build time platform detection', () => {
    test('Can override platform with npm_config_platform and npm_config_libc', function (t) {
      process.env.npm_config_platform = 'testplatform';
      process.env.npm_config_libc = 'testlibc';
      const platformArch = libvips.buildPlatformArch();
      if (platformArch === 'wasm32') {
        return this.skip();
      }
      t.plan(1);
      const [platform] = platformArch.split('-');
      t.assert.strictEqual(platform, 'testplatformtestlibc');
      delete process.env.npm_config_platform;
      delete process.env.npm_config_libc;
    });
    test('Can override arch with npm_config_arch', function (t) {
      process.env.npm_config_arch = 'test';
      const platformArch = libvips.buildPlatformArch();
      if (platformArch === 'wasm32') {
        return this.skip();
      }
      t.plan(1);
      const [, arch] = platformArch.split('-');
      t.assert.strictEqual(arch, 'test');
      delete process.env.npm_config_arch;
    });
  });

  suite('Build time directories', () => {
    test('sharp-libvips include', async (t) => {
      const dir = libvips.buildSharpLibvipsIncludeDir();
      if (dir) {
        t.plan(1);
        t.assert.strictEqual((await fs.stat(dir)).isDirectory(), true);
      }
    });
    test('sharp-libvips cplusplus', async (t) => {
      const dir = libvips.buildSharpLibvipsCPlusPlusDir();
      if (dir) {
        t.plan(1);
        t.assert.strictEqual((await fs.stat(dir)).isDirectory(), true);
      }
    });
    test('sharp-libvips lib', async (t) => {
      const dir = libvips.buildSharpLibvipsLibDir();
      if (dir) {
        t.plan(1);
        t.assert.strictEqual((await fs.stat(dir)).isDirectory(), true);
      }
    });
  });

  suite('Runtime detection', () => {
    test('platform', (t) => {
      t.plan(1);
      const [platform] = libvips.runtimePlatformArch().split('-');
      t.assert.strictEqual(true, ['darwin', 'freebsd', 'linux', 'linuxmusl', 'win32'].includes(platform));
    });
    test('arch', (t) => {
      t.plan(1);
      const [, arch] = libvips.runtimePlatformArch().split('-');
      t.assert.strictEqual(true, ['arm', 'arm64', 'ia32', 'x64', 'ppc64'].includes(arch));
    });
    test('isUnsupportedNodeRuntime', (t) => {
      t.plan(1);
      t.assert.strictEqual(libvips.isUnsupportedNodeRuntime(), undefined);
    });
  });

  suite('logger', () => {
    const consoleLog = console.log;
    const consoleError = console.error;

    after(() => {
      console.log = consoleLog;
      console.error = consoleError;
    });

    test('logs an info message', async (t) => {
      t.plan(1);
      console.log = (msg) => {
        t.assert.strictEqual(msg, 'sharp: progress');
      };
      libvips.log('progress');
    });

    test('logs an error message', async (t) => {
      t.plan(1);
      console.error = (msg) => {
        t.assert.strictEqual(msg, 'sharp: Installation error: problem');
      };
      libvips.log(new Error('problem'));
    });
  });

  suite('yarn locator hash', () => {
    test('known platform', (t) => {
      t.plan(1);
      const cc = process.env.CC;
      delete process.env.CC;
      process.env.npm_config_platform = 'linux';
      process.env.npm_config_arch = 's390x';
      process.env.npm_config_libc = '';
      const locatorHash = libvips.yarnLocator();
      t.assert.strictEqual(locatorHash, '3d36971ee5');
      delete process.env.npm_config_platform;
      delete process.env.npm_config_arch;
      delete process.env.npm_config_libc;
      process.env.CC = cc;
    });
    test('unknown platform', (t) => {
      t.plan(1);
      process.env.npm_config_platform = 'unknown-platform';
      const locatorHash = libvips.yarnLocator();
      t.assert.strictEqual(locatorHash, '');
      delete process.env.npm_config_platform;
    });
  });
});
