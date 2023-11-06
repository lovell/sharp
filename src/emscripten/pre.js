// Copyright 2013 Lovell Fuller and others.
// SPDX-License-Identifier: Apache-2.0

/* global Module, ENV, _vips_shutdown, _uv_library_shutdown */

Module.preRun = () => {
  ENV.VIPS_CONCURRENCY = Number(process.env.VIPS_CONCURRENCY) || 1;
};

Module.onRuntimeInitialized = () => {
  module.exports = Module.emnapiInit({
    context: require('@emnapi/runtime').getDefaultContext()
  });

  process.once('exit', () => {
    _vips_shutdown();
    _uv_library_shutdown();
  });
};
