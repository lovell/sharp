// Copyright 2013 Lovell Fuller and others.
// SPDX-License-Identifier: Apache-2.0

'use strict';

const assert = require('assert');
const platform = require('../../lib/platform');

describe('Platform-detection', function () {
  it('Can override arch with npm_config_arch', function () {
    process.env.npm_config_arch = 'test';
    assert.strictEqual('test', platform().split('-')[1]);
    delete process.env.npm_config_arch;
  });

  it('Can override platform with npm_config_platform', function () {
    process.env.npm_config_platform = 'test';
    assert.strictEqual('test', platform().split('-')[0]);
    delete process.env.npm_config_platform;
  });

  it('Can override ARM version via --arm-version', function () {
    process.env.npm_config_arch = 'arm';
    process.env.npm_config_arm_version = 'test';
    assert.strictEqual('armvtest', platform().split('-')[1]);
    delete process.env.npm_config_arm_version;
    delete process.env.npm_config_arch;
  });

  it('Can override ARM64 version via --arm-version', function () {
    process.env.npm_config_arch = 'arm64';
    process.env.npm_config_arm_version = 'test';
    assert.strictEqual('arm64vtest', platform().split('-')[1]);
    delete process.env.npm_config_arm_version;
    delete process.env.npm_config_arch;
  });

  if (process.config.variables.arm_version) {
    it('Can detect ARM version via process.config', function () {
      process.env.npm_config_arch = 'arm';
      assert.strictEqual(`armv${process.config.variables.arm_version}`, platform().split('-')[1]);
      delete process.env.npm_config_arch;
    });
  }

  if (!process.config.variables.arm_version) {
    it('Defaults to ARMv6 for 32-bit', function () {
      process.env.npm_config_arch = 'arm';
      assert.strictEqual('armv6', platform().split('-')[1]);
      delete process.env.npm_config_arch;
    });
  }

  it('Defaults to ARMv8 for 64-bit', function () {
    process.env.npm_config_arch = 'arm64';
    assert.strictEqual('arm64v8', platform().split('-')[1]);
    delete process.env.npm_config_arch;
  });

  it('Can ensure version ARMv7 if electron version is present', function () {
    process.env.npm_config_arch = 'arm';
    process.versions.electron = 'test';
    assert.strictEqual('armv7', platform().split('-')[1]);
    delete process.env.npm_config_arch;
    delete process.versions.electron;
  });

  it('Can override libc if platform is linux', function () {
    process.env.npm_config_platform = 'linux';
    process.env.npm_config_libc = 'test';
    assert.strictEqual('linuxtest', platform().split('-')[0]);
    delete process.env.npm_config_platform;
    delete process.env.npm_config_libc;
  });

  it('Handles libc value "glibc" as default linux', function () {
    process.env.npm_config_platform = 'linux';
    process.env.npm_config_libc = 'glibc';
    assert.strictEqual('linux', platform().split('-')[0]);
    delete process.env.npm_config_platform;
    delete process.env.npm_config_libc;
  });

  it('Discards libc value on non-linux platform', function () {
    process.env.npm_config_platform = 'win32';
    process.env.npm_config_libc = 'gnuwin32';
    assert.strictEqual('win32', platform().split('-')[0]);
    delete process.env.npm_config_platform;
    delete process.env.npm_config_libc;
  });
});
