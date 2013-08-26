var sharp = require("../index");
var imagemagick = require("imagemagick");
var assert = require("assert");
var Benchmark = require("benchmark");

var input = __dirname + "/2569067123_aca715a2ee_o.jpg"; // http://www.flickr.com/photos/grizdave/2569067123/
var output = __dirname + "/output.jpg";
var width = 640;
var height = 480;

var suite = new Benchmark.Suite;
suite.add("imagemagick", {
  "defer": true,
  "fn": function(deferred) {
    imagemagick.resize({
      srcPath: input,
      dstPath: output,
      quality: 0.75,
      width: width,
      height: height
    }, function(err) {
      if (err) {
        throw err;
      } else {
        deferred.resolve();
      }
    });
  }
}).add("sharp", {
  "defer": true,
  "fn": function(deferred) {
    sharp.crop(input, output, width, height, function(err) {
      if (err) {
        throw err;
      } else {
        deferred.resolve();
      }
    });
  }
}).on("cycle", function(event) {
  console.log(String(event.target));
}).on("complete", function() {
  assert(this.filter("fastest").pluck("name") == "sharp");
}).run();
