'use strict';

const platformAndArch = require('./platform')();

/* istanbul ignore next */
try {
  module.exports = require(`../build/Release/sharp-${platformAndArch}.node`);
} catch (err) {
  // Bail early if bindings aren't available
  const help = ['', 'Something went wrong installing the "sharp" module', '', err.message, '', 'Possible solutions:'];
  if (/dylib/.test(err.message) && /Incompatible library version/.test(err.message)) {
    help.push('- Update Homebrew: "brew update && brew upgrade vips"');
  } else {
    const [platform, arch] = platformAndArch.split('-');
    help.push(
      '- Install with the --verbose flag and look for errors: "npm install --ignore-scripts=false --verbose sharp"',
      `- Install for the current ${platformAndArch} runtime: "npm install --platform=${platform} --arch=${arch} sharp"`
    );
  }
  help.push(
    '- Consult the installation documentation: https://sharp.pixelplumbing.com/install'
  );
  // Check loaded
  if (process.platform === 'win32' || /symbol/.test(err.message)) {
    const loadedModule = Object.keys(require.cache).find((i) => /[\\/]build[\\/]Release[\\/]sharp(.*)\.node$/.test(i));
    if (loadedModule) {
      const [, loadedPackage] = loadedModule.match(/node_modules[\\/]([^\\/]+)[\\/]/);
      help.push(`- Ensure the version of sharp aligns with the ${loadedPackage} package: "npm ls sharp"`);
    }
  }
  throw new Error(help.join('\n'));
}
