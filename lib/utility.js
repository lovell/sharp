'use strict';

const events = require('events');
const is = require('./is');
const sharp = require('../build/Release/sharp.node');

/**
 * An Object containing nested boolean values representing the available input and output formats/methods.
 * @member
 * @example
 * console.log(sharp.format);
 * @returns {Object}
 */
const format = sharp.format();

/**
 * An Object containing the version numbers of libvips and its dependencies.
 * @member
 * @example
 * console.log(sharp.versions);
 */
let versions = {
  vips: sharp.libvipsVersion()
};
try {
  versions = require(`../vendor/${versions.vips}/versions.json`);
} catch (err) {}

/**
 * Gets or, when options are provided, sets the limits of _libvips'_ operation cache.
 * Existing entries in the cache will be trimmed after any change in limits.
 * This method always returns cache statistics,
 * useful for determining how much working memory is required for a particular task.
 *
 * @example
 * const stats = sharp.cache();
 * @example
 * sharp.cache( { items: 200 } );
 * sharp.cache( { files: 0 } );
 * sharp.cache(false);
 *
 * @param {Object|boolean} [options=true] - Object with the following attributes, or boolean where true uses default cache settings and false removes all caching
 * @param {number} [options.memory=50] - is the maximum memory in MB to use for this cache
 * @param {number} [options.files=20] - is the maximum number of files to hold open
 * @param {number} [options.items=100] - is the maximum number of operations to cache
 * @returns {Object}
 */
function cache (options) {
  if (is.bool(options)) {
    if (options) {
      // Default cache settings of 50MB, 20 files, 100 items
      return sharp.cache(50, 20, 100);
    } else {
      return sharp.cache(0, 0, 0);
    }
  } else if (is.object(options)) {
    return sharp.cache(options.memory, options.files, options.items);
  } else {
    return sharp.cache();
  }
}
cache(true);

/**
 * Gets or, when a concurrency is provided, sets
 * the number of threads _libvips'_ should create to process each image.
 * The default value is the number of CPU cores.
 * A value of `0` will reset to this default.
 *
 * The maximum number of images that can be processed in parallel
 * is limited by libuv's `UV_THREADPOOL_SIZE` environment variable.
 *
 * This method always returns the current concurrency.
 *
 * @example
 * const threads = sharp.concurrency(); // 4
 * sharp.concurrency(2); // 2
 * sharp.concurrency(0); // 4
 *
 * @param {number} [concurrency]
 * @returns {number} concurrency
 */
function concurrency (concurrency) {
  return sharp.concurrency(is.integer(concurrency) ? concurrency : null);
}

/**
 * An EventEmitter that emits a `change` event when a task is either:
 * - queued, waiting for _libuv_ to provide a worker thread
 * - complete
 * @member
 * @example
 * sharp.queue.on('change', function(queueLength) {
 *   console.log('Queue contains ' + queueLength + ' task(s)');
 * });
 */
const queue = new events.EventEmitter();

/**
 * Provides access to internal task counters.
 * - queue is the number of tasks this module has queued waiting for _libuv_ to provide a worker thread from its pool.
 * - process is the number of resize tasks currently being processed.
 *
 * @example
 * const counters = sharp.counters(); // { queue: 2, process: 4 }
 *
 * @returns {Object}
 */
function counters () {
  return sharp.counters();
}

/**
 * Get and set use of SIMD vector unit instructions.
 * Requires libvips to have been compiled with liborc support.
 *
 * Improves the performance of `resize`, `blur` and `sharpen` operations
 * by taking advantage of the SIMD vector unit of the CPU, e.g. Intel SSE and ARM NEON.
 *
 * @example
 * const simd = sharp.simd();
 * // simd is `true` if the runtime use of liborc is currently enabled
 * @example
 * const simd = sharp.simd(false);
 * // prevent libvips from using liborc at runtime
 *
 * @param {boolean} [simd=true]
 * @returns {boolean}
 */
function simd (simd) {
  return sharp.simd(is.bool(simd) ? simd : null);
}
simd(true);

/**
 * Decorate the Sharp class with utility-related functions.
 * @private
 */
module.exports = function (Sharp) {
  [
    cache,
    concurrency,
    counters,
    simd
  ].forEach(function (f) {
    Sharp[f.name] = f;
  });
  Sharp.format = format;
  Sharp.versions = versions;
  Sharp.queue = queue;
};
