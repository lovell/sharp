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

  it('Can override ARM version via npm_config_armv', function () {
    process.env.npm_config_arch = 'arm';
    process.env.npm_config_armv = 'test';
    assert.strictEqual('armvtest', platform().split('-')[1]);
    delete process.env.npm_config_armv;
    delete process.env.npm_config_arch;
  });

  it('Can detect ARM version via process.config', function () {
    process.env.npm_config_arch = 'armhf';
    const armVersion = process.config.variables.arm_version;
    process.config.variables.arm_version = 'test';
    assert.strictEqual('armvtest', platform().split('-')[1]);
    process.config.variables.arm_version = armVersion;
    delete process.env.npm_config_arch;
  });

  it('Defaults to ARMv6 for 32-bit', function () {
    process.env.npm_config_arch = 'arm';
    assert.strictEqual('armv6', platform().split('-')[1]);
    delete process.env.npm_config_arch;
  });

  it('Defaults to ARMv8 for 64-bit', function () {
    process.env.npm_config_arch = 'arm64';
    assert.strictEqual('armv8', platform().split('-')[1]);
    delete process.env.npm_config_arch;
  });
});
