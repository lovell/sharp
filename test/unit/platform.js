'use strict';

const assert = require('assert');
const platform = require('../../lib/platform');

describe('Platform-detection', function () {
  function npmConfigKeys () {
    return Object.keys(process.env).filter((key) => key.startsWith('npm_config_'));
  }

  const npmEnv = {};

  // Save the original config for other test suites.
  before(() => {
    for (const key of npmConfigKeys()) {
      npmEnv[key] = process.env[key];
    }
  });

  function cleanupEnv () {
    for (const key of npmConfigKeys()) {
      delete process.env[key];
    }
  }

  // Don't let outer npm_config_* variables leak into a platform test.
  beforeEach(cleanupEnv);

  // Restore the original config for other test suites.
  after(() => {
    cleanupEnv();
    Object.assign(process.env, npmEnv);
  });

  it('Can override arch with npm_config_arch', function () {
    process.env.npm_config_arch = 'test';
    assert.strictEqual('test', platform().split('-')[1]);
  });

  it('Can override platform with npm_config_platform', function () {
    process.env.npm_config_platform = 'test';
    assert.strictEqual('test', platform().split('-')[0]);
  });

  it('Can override ARM version via --arm-version', function () {
    process.env.npm_config_arch = 'arm';
    process.env.npm_config_arm_version = 'test';
    assert.strictEqual('armvtest', platform().split('-')[1]);
  });

  it('Can override ARM64 version via --arm-version', function () {
    process.env.npm_config_arch = 'arm64';
    process.env.npm_config_arm_version = 'test';
    assert.strictEqual('arm64vtest', platform().split('-')[1]);
  });

  if (process.config.variables?.arm_version) {
    it('Can detect ARM version via process.config', function () {
      process.env.npm_config_arch = 'arm';
      assert.strictEqual(`armv${process.config.variables.arm_version}`, platform().split('-')[1]);
    });
  } else {
    it('Defaults to ARMv6 for 32-bit', function () {
      process.env.npm_config_arch = 'arm';
      assert.strictEqual('armv6', platform().split('-')[1]);
    });
  }

  it('Defaults to ARMv8 for 64-bit', function () {
    process.env.npm_config_arch = 'arm64';
    assert.strictEqual('arm64v8', platform().split('-')[1]);
  });

  it('Can ensure version ARMv7 if electron version is present', function () {
    process.env.npm_config_arch = 'arm';
    process.versions.electron = 'test';
    assert.strictEqual('armv7', platform().split('-')[1]);
    delete process.versions.electron;
  });

  it('Can override libc if platform is linux', function () {
    process.env.npm_config_platform = 'linux';
    process.env.npm_config_libc = 'test';
    assert.strictEqual('linuxtest', platform().split('-')[0]);
  });

  it('Handles libc value "glibc" as default linux', function () {
    process.env.npm_config_platform = 'linux';
    process.env.npm_config_libc = 'glibc';
    assert.strictEqual('linux', platform().split('-')[0]);
  });

  it('Discards libc value on non-linux platform', function () {
    process.env.npm_config_platform = 'win32';
    process.env.npm_config_libc = 'gnuwin32';
    assert.strictEqual('win32', platform().split('-')[0]);
  });
});
