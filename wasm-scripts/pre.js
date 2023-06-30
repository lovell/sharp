/* global Module, ENV, _vips_shutdown, _uv_library_shutdown */

let vipsConcurrency;
if ('webcontainer' in process.versions) {
  vipsConcurrency = 2;
} else {
  vipsConcurrency = +process.env.VIPS_CONCURRENCY || require('os').cpus().length;
}

Module.preRun = () => {
  ENV.VIPS_CONCURRENCY = vipsConcurrency;
};

Module.onRuntimeInitialized = () => {
  const emnapi = Module.emnapiInit({
    context: require('@emnapi/runtime').getDefaultContext()
    // nodeBinding: require('@emnapi/node-binding')
  });

  const { concurrency } = emnapi;
  emnapi.concurrency = function (maybeSet) {
    if (typeof maybeSet === 'number' && maybeSet > vipsConcurrency) {
      console.warn(
        `Requested concurrency (${maybeSet}) is higher than the set limit (${vipsConcurrency}).`
      );
      maybeSet = vipsConcurrency;
    }
    return concurrency.call(this, maybeSet);
  };

  // Cleanly shutdown libvips when Node.js exits.
  // This doesn't matter too much in real Node.js, but it does in WebContainer.
  process.once('exit', () => {
    _vips_shutdown();
    _uv_library_shutdown();
  });

  module.exports = emnapi;
};
