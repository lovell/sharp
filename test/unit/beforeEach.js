'use strict';

const detectLibc = require('detect-libc');
const sharp = require('../../');

const usingCache = detectLibc.family !== detectLibc.MUSL;
const usingSimd = !process.env.G_DEBUG;
const concurrency =
  detectLibc.family === detectLibc.MUSL || process.arch === 'arm'
    ? 1
    : undefined;

beforeEach(function () {
  sharp.cache(usingCache);
  sharp.simd(usingSimd);
  sharp.concurrency(concurrency);
});

afterEach(function () {
  if (global.gc) {
    global.gc();
  }
});
