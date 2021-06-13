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
    help.push(
      '- Install with the --verbose flag and look for errors: "npm install --ignore-scripts=false --verbose sharp"',
      `- Install for the current runtime: "npm install --platform=${process.platform} --arch=${process.arch} sharp"`
    );
  }
  help.push(
    '- Consult the installation documentation: https://sharp.pixelplumbing.com/install'
  );
  console.error(help.join('\n'));
  process.exit(1);
}
