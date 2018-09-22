'use strict';

const detectLibc = require('detect-libc');
const sharp = require('../../');

const usingCache = detectLibc.family !== detectLibc.MUSL;
const usingSimd = !process.env.G_DEBUG;

beforeEach(function () {
  sharp.cache(usingCache);
  sharp.simd(usingSimd);
});
