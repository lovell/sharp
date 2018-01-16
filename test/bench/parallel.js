'use strict';

process.env.UV_THREADPOOL_SIZE = 64;

const assert = require('assert');
const async = require('async');

const sharp = require('../../');
const fixtures = require('../fixtures');

const width = 720;
const height = 480;

sharp.concurrency(1);
sharp.simd(true);

const timer = setInterval(function () {
  console.dir(sharp.counters());
}, 100);

async.mapSeries([1, 1, 2, 4, 8, 16, 32, 64], function (parallelism, next) {
  const start = new Date().getTime();
  async.times(parallelism,
    function (id, callback) {
      /* jslint unused: false */
      sharp(fixtures.inputJpg).resize(width, height).toBuffer(function (err, buffer) {
        buffer = null;
        callback(err, new Date().getTime() - start);
      });
    },
    function (err, ids) {
      assert(!err);
      assert(ids.length === parallelism);
      ids.sort();
      const mean = ids.reduce(function (a, b) {
        return a + b;
      }) / ids.length;
      console.log(parallelism + ' parallel calls: fastest=' + ids[0] + 'ms slowest=' + ids[ids.length - 1] + 'ms mean=' + mean + 'ms');
      next();
    }
  );
}, function () {
  clearInterval(timer);
  console.dir(sharp.counters());
});
