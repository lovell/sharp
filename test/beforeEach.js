// Copyright 2013 Lovell Fuller and others.
// SPDX-License-Identifier: Apache-2.0

'use strict';

const sharp = require('../');

const usingCache = !process.env.G_DEBUG;
const usingSimd = !process.env.VIPS_NOVECTOR;
const concurrency = Number(process.env.VIPS_CONCURRENCY) || 0;

exports.mochaHooks = {
  beforeEach () {
    sharp.cache(usingCache);
    sharp.simd(usingSimd);
    sharp.concurrency(concurrency);
  },

  afterEach () {
    if (global.gc) {
      global.gc();
    }
  }
};
