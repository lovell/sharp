var sharp = require("../index");
var fs = require("fs");
var assert = require("assert");
var async = require("async");

var inputJpg = __dirname + "/2569067123_aca715a2ee_o.jpg"; // http://www.flickr.com/photos/grizdave/2569067123/
var width = 720;
var height = 480;

async.mapSeries([1, 1, 2, 4, 8, 16, 32, 64, 128], function(parallelism, next) {
  var start = new Date().getTime();
  async.times(parallelism,
    function(id, callback) {
      sharp(inputJpg).resize(width, height).toBuffer(function(err, buffer) {
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
      console.log(parallelism + " parallel calls: fastest=" + ids[0] + "ms slowest=" + ids[ids.length - 1] + "ms mean=" + mean + "ms");
      next();
    }
  );
}, function() {
  console.dir(sharp.cache());
});
