'use strict';

module.exports = function () {
  const arch = process.env.npm_config_arch || process.arch;
  const platform = process.env.npm_config_platform || process.platform;

  const platformId = [platform];
  if (arch === 'arm' || arch === 'armhf' || arch === 'arm64') {
    const armVersion = (arch === 'arm64') ? '8' : process.env.npm_config_armv || process.config.variables.arm_version || '6';
    platformId.push(`armv${armVersion}`);
  } else {
    platformId.push(arch);
  }
  return platformId.join('-');
};
