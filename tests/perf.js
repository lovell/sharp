var sharp = require("../index");
var imagemagick = require("imagemagick");
var gm = require("gm");
var epeg = require("epeg");
var async = require("async");
var assert = require("assert");
var Benchmark = require("benchmark");

var inputJpg = __dirname + "/2569067123_aca715a2ee_o.jpg"; // http://www.flickr.com/photos/grizdave/2569067123/
var outputJpg = __dirname + "/output.jpg";
var outputJpgLength = 47035;

var inputPng = __dirname + "/50020484-00001.png"; // http://c.searspartsdirect.com/lis_png/PLDM/50020484-00001.png
var outputPng = __dirname + "/output.png";
var outputPngLength = 60380;

var width = 640;
var height = 480;

async.series({
  jpeg: function(callback) {
    (new Benchmark.Suite("jpeg")).add("imagemagick", {
      defer: true,
      fn: function(deferred) {
        imagemagick.resize({
          srcPath: inputJpg,
          dstPath: outputJpg,
          quality: 0.8,
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
    }).add("gm", {
      defer: true,
      fn: function(deferred) {
        gm(inputJpg).crop(width, height).quality(80).write(outputJpg, function (err) {
          if (err) {
            throw err;
          } else {
            deferred.resolve();
          }
        });
      }
    }).add("epeg", {
      defer: true,
      fn: function(deferred) {
        var image = new epeg.Image({path: inputJpg});
        image.downsize(width, height, 80).saveTo(outputJpg);
        deferred.resolve();
      }
    }).add("sharp-file", {
      defer: true,
      fn: function(deferred) {
        sharp.crop(inputJpg, outputJpg, width, height, function(err) {
          if (err) {
            throw err;
          } else {
            deferred.resolve();
          }
        });
      }
    }).add("sharp-buffer", {
      defer: true,
      fn: function(deferred) {
        sharp.crop(inputJpg, sharp.buffer.jpeg, width, height, function(err, buffer) {
          if (err) {
            throw err;
          } else {
            assert.notStrictEqual(null, buffer);
            assert.strictEqual(outputJpgLength, buffer.length);
            deferred.resolve();
          }
        });
      }
    }).on("cycle", function(event) {
      console.log("jpeg " + String(event.target));
    }).on("complete", function() {
      callback(null, this.filter("fastest").pluck("name"));
    }).run();
  },
  png: function(callback) {
    (new Benchmark.Suite("png")).add("imagemagick", {
      defer: true,
      fn: function(deferred) {
        imagemagick.resize({
          srcPath: inputPng,
          dstPath: outputPng,
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
    }).add("gm", {
      defer: true,
      fn: function(deferred) {
        gm(inputPng).crop(width, height).write(outputPng, function (err) {
          if (err) {
            throw err;
          } else {
            deferred.resolve();
          }
        });
      }
    }).add("sharp-file", {
      defer: true,
      fn: function(deferred) {
        sharp.crop(inputPng, outputPng, width, height, function(err) {
          if (err) {
            throw err;
          } else {
            deferred.resolve();
          }
        });
      }
    }).add("sharp-buffer", {
      defer: true,
      fn: function(deferred) {
        sharp.crop(inputPng, sharp.buffer.png, width, height, function(err, buffer) {
          if (err) {
            throw err;
          } else {
            assert.notStrictEqual(null, buffer);
            assert.strictEqual(outputPngLength, buffer.length);
            deferred.resolve();
          }
        });
      }
    }).on("cycle", function(event) {
      console.log(" png " + String(event.target));
    }).on("complete", function() {
      callback(null, this.filter("fastest").pluck("name"));
    }).run();
  }
}, function(err, results) {
  assert(!err, err);
  Object.keys(results).forEach(function(format) {
    assert.strictEqual("sharp", results[format].toString().substr(0, 5), "sharp was slower than " + results[format] + " for " + format);
  });
});
