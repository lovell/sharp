'use strict';

const detectLibc = require('detect-libc');

module.exports = function () {
  const arch = process.env.npm_config_arch || process.arch;
  const platform = process.env.npm_config_platform || process.platform;
  const libc = (platform === 'linux' && detectLibc.isNonGlibcLinux) ? detectLibc.family : '';

  const platformId = [`${platform}${libc}`];
  if (arch === 'arm' || arch === 'armhf' || arch === 'arm64') {
    const armVersion = (arch === 'arm64') ? '8' : process.env.npm_config_armv || process.config.variables.arm_version || '6';
    platformId.push(`armv${armVersion}`);
  } else {
    platformId.push(arch);
  }
  return platformId.join('-');
};
