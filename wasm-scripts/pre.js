/* global Module, ENV, PThread, _vips_shutdown */

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
    context: require('@tybys/emnapi-runtime').createContext(),
    // nodeBinding: require('@tybys/emnapi-node-binding')
  });

  // At this point only libvips workers are up & running.
  // Mark all of them as weakly referenced so that they
  // don't prevent Node.js from exiting.
  for (const worker of PThread.runningWorkers) {
    worker.unref();
  }

  function wrapProperty (prop, wrapper) {
    emnapi[prop] = wrapper(emnapi[prop]);
  }

  wrapProperty(
    'concurrency',
    (impl) =>
      function (maybeSet) {
        if (typeof maybeSet === 'number' && maybeSet > vipsConcurrency) {
          console.warn(
            `Requested concurrency (${maybeSet}) is higher than the set limit (${vipsConcurrency}).`
          );
          maybeSet = vipsConcurrency;
        }
        return impl.call(this, maybeSet);
      }
  );

  // Wrap async functions with a refcounter for the emnapi worker.
  // We must make sure that the worker is only strongly referenced
  // while it executes async functions, and doesn't prevent Node.js from exiting
  // otherwise.
  // At some point in future this should be handled by Emscripten or emnapi,
  // but for now, believe it or not, manual patching is actually easier.
  const emnapiWorker = PThread.unusedWorkers[0];
  let emnapiRefCount = 0;
  for (const fnName of ['metadata', 'pipeline', 'stats']) {
    wrapProperty(fnName, impl => function (...args) {
      if (emnapiRefCount++ === 0) {
        emnapiWorker.ref();
      }
      const callback = args.pop();
      args.push(function () {
        if (--emnapiRefCount === 0) {
          emnapiWorker.unref();
        }
        return callback.apply(this, arguments);
      });
      return impl.apply(this, args);
    });
  }

  // Cleanly shutdown libvips when Node.js exits.
  // This doesn't matter too much in real Node.js, but it does in WebContainer.
  process.once('exit', () => {
    _vips_shutdown();
  });

  module.exports = emnapi;
};
