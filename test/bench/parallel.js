'use strict';

var assert = require('assert');
var async = require('async');

var sharp = require('../../index');
var fixtures = require('../fixtures');

var width = 720;
var height = 480;

sharp.concurrency(1);

var timer = setInterval(function() {
  console.dir(sharp.counters());
}, 100);

async.mapSeries([1, 1, 2, 4, 8, 16, 32, 64, 128], function(parallelism, next) {
  var start = new Date().getTime();
  async.times(parallelism,
    function(id, callback) {
      /*jslint unused: false */
      sharp(fixtures.inputJpg).resize(width, height).toBuffer(function(err, buffer) {
        buffer = null;
        callback(err, new Date().getTime() - start);
      });
    },
    function(err, ids) {
      assert(!err);
      assert(ids.length === parallelism);
      var mean = ids.reduce(function(a, b) {
        return a + b;
      }) / ids.length;
      console.log(parallelism + ' parallel calls: fastest=' + ids[0] + 'ms slowest=' + ids[ids.length - 1] + 'ms mean=' + mean + 'ms');
      next();
    }
  );
}, function() {
  clearInterval(timer);
  console.dir(sharp.counters());
});
