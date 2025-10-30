/*!
  Copyright 2013 Lovell Fuller and others.
  SPDX-License-Identifier: Apache-2.0
*/

try {
  const { useGlobalLibvips } = require('../lib/libvips');
  if (useGlobalLibvips() || process.env.npm_config_build_from_source) {
    process.exit(1);
  }
} catch (err) {
  const summary = err.message.split(/\n/).slice(0, 1);
  console.log(`sharp: skipping install check: ${summary}`);
}
