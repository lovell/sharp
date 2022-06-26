'use strict';

const detectLibc = require('detect-libc');
const sharp = require('../../');

const libcFamily = detectLibc.familySync();
const usingCache = libcFamily !== detectLibc.MUSL;
const usingSimd = !(process.env.G_DEBUG || process.env.VIPS_NOVECTOR);
const concurrency = process.env.VIPS_CONCURRENCY ||
  (libcFamily === detectLibc.MUSL || process.arch === 'arm' ? 1 : undefined);

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
