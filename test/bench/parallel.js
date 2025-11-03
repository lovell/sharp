/*!
  Copyright 2013 Lovell Fuller and others.
  SPDX-License-Identifier: Apache-2.0
*/

process.env.UV_THREADPOOL_SIZE = 64;

const assert = require('node:assert');
const async = require('async');

const sharp = require('../../');
const fixtures = require('../fixtures');

const width = 720;
const height = 480;

sharp.concurrency(1);

const timer = setInterval(() => {
  console.dir(sharp.counters());
}, 100);

async.mapSeries([1, 1, 2, 4, 8, 16, 32, 64], (parallelism, next) => {
  const start = Date.now();
  async.times(parallelism,
    (_id, callback) => {
      sharp(fixtures.inputJpg).resize(width, height).toBuffer((err, buffer) => {
        buffer = null;
        callback(err, Date.now() - start);
      });
    },
    (err, ids) => {
      assert(!err);
      assert(ids.length === parallelism);
      ids.sort();
      const mean = ids.reduce((a, b) => a + b) / ids.length;
      console.log(`${parallelism} parallel calls: fastest=${ids[0]}ms slowest=${ids[ids.length - 1]}ms mean=${mean}ms`);
      next();
    }
  );
}, () => {
  clearInterval(timer);
  console.dir(sharp.counters());
});
