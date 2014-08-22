var sharp = require("../index");
var fs = require("fs");
var path = require("path");
var imagemagick = require("imagemagick");
var imagemagickNative = require("imagemagick-native");
var gm = require("gm");
var async = require("async");
var assert = require("assert");
var Benchmark = require("benchmark");

var fixturesPath = path.join(__dirname, "fixtures");

var inputJpg = path.join(fixturesPath, "2569067123_aca715a2ee_o.jpg"); // http://www.flickr.com/photos/grizdave/2569067123/
var outputJpg = path.join(fixturesPath, "output.jpg");

var inputPng = path.join(fixturesPath, "50020484-00001.png"); // http://c.searspartsdirect.com/lis_png/PLDM/50020484-00001.png
var outputPng = path.join(fixturesPath, "output.png");

var inputWebp = path.join(fixturesPath, "4.webp"); // http://www.gstatic.com/webp/gallery/4.webp
var outputWebp = path.join(fixturesPath, "output.webp");

var inputTiff = path.join(fixturesPath, "G31D.TIF"); // http://www.fileformat.info/format/tiff/sample/e6c9a6e5253348f4aef6d17b534360ab/index.htm
var outputTiff = path.join(fixturesPath, "output.tiff");

var inputGif = path.join(fixturesPath, "Crash_test.gif"); // http://upload.wikimedia.org/wikipedia/commons/e/e3/Crash_test.gif

var width = 720;
var height = 480;

// Disable libvips cache to ensure tests are as fair as they can be
sharp.cache(0);

async.series({
  jpeg: function(callback) {
    var inputJpgBuffer = fs.readFileSync(inputJpg);
    (new Benchmark.Suite("jpeg")).add("imagemagick-file-file", {
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
    }).add("imagemagick-native-buffer-buffer", {
      defer: true,
      fn: function(deferred) {
        imagemagickNative.convert({
          srcData: inputJpgBuffer,
          quality: 80,
          width: width,
          height: height,
					format: 'JPEG'
        });
				deferred.resolve();
      }
    }).add("gm-buffer-file", {
      defer: true,
      fn: function(deferred) {
        gm(inputJpgBuffer).resize(width, height).quality(80).write(outputJpg, function (err) {
          if (err) {
            throw err;
          } else {
            deferred.resolve();
          }
        });
      }
    }).add("gm-buffer-buffer", {
      defer: true,
      fn: function(deferred) {
        gm(inputJpgBuffer).resize(width, height).quality(80).toBuffer(function (err, buffer) {
          if (err) {
            throw err;
          } else {
            assert.notStrictEqual(null, buffer);
            deferred.resolve();
          }
        });
      }
    }).add("gm-file-file", {
      defer: true,
      fn: function(deferred) {
        gm(inputJpg).resize(width, height).quality(80).write(outputJpg, function (err) {
          if (err) {
            throw err;
          } else {
            deferred.resolve();
          }
        });
      }
    }).add("gm-file-buffer", {
      defer: true,
      fn: function(deferred) {
        gm(inputJpg).resize(width, height).quality(80).toBuffer(function (err, buffer) {
          if (err) {
            throw err;
          } else {
            assert.notStrictEqual(null, buffer);
            deferred.resolve();
          }
        });
      }
    }).add("sharp-buffer-file", {
      defer: true,
      fn: function(deferred) {
        sharp(inputJpgBuffer).resize(width, height).toFile(outputJpg, function(err) {
          if (err) {
            throw err;
          } else {
            deferred.resolve();
          }
        });
      }
    }).add("sharp-buffer-buffer", {
      defer: true,
      fn: function(deferred) {
        sharp(inputJpgBuffer).resize(width, height).toBuffer(function(err, buffer) {
          if (err) {
            throw err;
          } else {
            assert.notStrictEqual(null, buffer);
            deferred.resolve();
          }
        });
      }
    }).add("sharp-file-file", {
      defer: true,
      fn: function(deferred) {
        sharp(inputJpg).resize(width, height).toFile(outputJpg, function(err) {
          if (err) {
            throw err;
          } else {
            deferred.resolve();
          }
        });
      }
    }).add("sharp-stream-stream", {
      defer: true,
      fn: function(deferred) {
        var readable = fs.createReadStream(inputJpg);
        var writable = fs.createWriteStream(outputJpg);
        writable.on('finish', function() {
          deferred.resolve();
        });
        var pipeline = sharp().resize(width, height);
        readable.pipe(pipeline).pipe(writable);
      }
    }).add("sharp-file-buffer", {
      defer: true,
      fn: function(deferred) {
        sharp(inputJpg).resize(width, height).toBuffer(function(err, buffer) {
          if (err) {
            throw err;
          } else {
            assert.notStrictEqual(null, buffer);
            deferred.resolve();
          }
        });
      }
    }).add("sharp-file-buffer-promise", {
      defer: true,
      fn: function(deferred) {
        sharp(inputJpg).resize(width, height).toBuffer().then(function(buffer) {
          assert.notStrictEqual(null, buffer);
          deferred.resolve();
        });
      }
    }).add("sharp-file-buffer-sharpen", {
      defer: true,
      fn: function(deferred) {
        sharp(inputJpg).resize(width, height).sharpen().toBuffer(function(err, buffer) {
          if (err) {
            throw err;
          } else {
            assert.notStrictEqual(null, buffer);
            deferred.resolve();
          }
        });
      }
    }).add("sharp-file-buffer-bicubic", {
      defer: true,
      fn: function(deferred) {
        sharp(inputJpg).resize(width, height).interpolateWith(sharp.interpolator.bicubic).toBuffer(function(err, buffer) {
          if (err) {
            throw err;
          } else {
            assert.notStrictEqual(null, buffer);
            deferred.resolve();
          }
        });
      }
    }).add("sharp-file-buffer-nohalo", {
      defer: true,
      fn: function(deferred) {
        sharp(inputJpg).resize(width, height).interpolateWith(sharp.interpolator.nohalo).toBuffer(function(err, buffer) {
          if (err) {
            throw err;
          } else {
            assert.notStrictEqual(null, buffer);
            deferred.resolve();
          }
        });
      }
    }).add("sharp-file-buffer-locallyBoundedBicubic", {
      defer: true,
      fn: function(deferred) {
        sharp(inputJpg).resize(width, height).interpolateWith(sharp.interpolator.locallyBoundedBicubic).toBuffer(function(err, buffer) {
          if (err) {
            throw err;
          } else {
            assert.notStrictEqual(null, buffer);
            deferred.resolve();
          }
        });
      }
    }).add("sharp-file-buffer-vertexSplitQuadraticBasisSpline", {
      defer: true,
      fn: function(deferred) {
        sharp(inputJpg).resize(width, height).interpolateWith(sharp.interpolator.vertexSplitQuadraticBasisSpline).toBuffer(function(err, buffer) {
          if (err) {
            throw err;
          } else {
            assert.notStrictEqual(null, buffer);
            deferred.resolve();
          }
        });
      }
    }).add("sharp-file-buffer-progressive", {
      defer: true,
      fn: function(deferred) {
        sharp(inputJpg).resize(width, height).progressive().toBuffer(function(err, buffer) {
          if (err) {
            throw err;
          } else {
            assert.notStrictEqual(null, buffer);
            deferred.resolve();
          }
        });
      }
    }).add("sharp-file-buffer-rotate", {
      defer: true,
      fn: function(deferred) {
        sharp(inputJpg).rotate(90).resize(width, height).toBuffer(function(err, buffer) {
          if (err) {
            throw err;
          } else {
            assert.notStrictEqual(null, buffer);
            deferred.resolve();
          }
        });
      }
    }).add("sharp-file-buffer-sequentialRead", {
      defer: true,
      fn: function(deferred) {
        sharp(inputJpg).resize(width, height).sequentialRead().toBuffer(function(err, buffer) {
          if (err) {
            throw err;
          } else {
            assert.notStrictEqual(null, buffer);
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
    var inputPngBuffer = fs.readFileSync(inputPng);
    (new Benchmark.Suite("png")).add("imagemagick-file-file", {
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
    }).add("imagemagick-native-buffer-buffer", {
      defer: true,
      fn: function(deferred) {
        imagemagickNative.convert({
          srcData: inputPngBuffer,
          width: width,
          height: height,
					format: 'PNG'
        });
				deferred.resolve();
      }
    }).add("gm-file-file", {
      defer: true,
      fn: function(deferred) {
        gm(inputPng).resize(width, height).write(outputPng, function (err) {
          if (err) {
            throw err;
          } else {
            deferred.resolve();
          }
        });
      }
    }).add("gm-file-buffer", {
      defer: true,
      fn: function(deferred) {
        gm(inputPng).resize(width, height).quality(80).toBuffer(function (err, buffer) {
          if (err) {
            throw err;
          } else {
            assert.notStrictEqual(null, buffer);
            deferred.resolve();
          }
        });
      }
    }).add("sharp-buffer-file", {
      defer: true,
      fn: function(deferred) {
        sharp(inputPngBuffer).resize(width, height).toFile(outputPng, function(err) {
          if (err) {
            throw err;
          } else {
            deferred.resolve();
          }
        });
      }
    }).add("sharp-buffer-buffer", {
      defer: true,
      fn: function(deferred) {
        sharp(inputPngBuffer).resize(width, height).toBuffer(function(err, buffer) {
          if (err) {
            throw err;
          } else {
            assert.notStrictEqual(null, buffer);
            deferred.resolve();
          }
        });
      }
    }).add("sharp-file-file", {
      defer: true,
      fn: function(deferred) {
        sharp(inputPng).resize(width, height).toFile(outputPng, function(err) {
          if (err) {
            throw err;
          } else {
            deferred.resolve();
          }
        });
      }
    }).add("sharp-file-buffer", {
      defer: true,
      fn: function(deferred) {
        sharp(inputPng).resize(width, height).toBuffer(function(err, buffer) {
          if (err) {
            throw err;
          } else {
            assert.notStrictEqual(null, buffer);
            deferred.resolve();
          }
        });
      }
    }).add("sharp-file-buffer-sharpen", {
      defer: true,
      fn: function(deferred) {
        sharp(inputPng).resize(width, height).sharpen().toBuffer(function(err, buffer) {
          if (err) {
            throw err;
          } else {
            assert.notStrictEqual(null, buffer);
            deferred.resolve();
          }
        });
      }
    }).add("sharp-file-buffer-progressive", {
      defer: true,
      fn: function(deferred) {
        sharp(inputPng).resize(width, height).progressive().toBuffer(function(err, buffer) {
          if (err) {
            throw err;
          } else {
            assert.notStrictEqual(null, buffer);
            deferred.resolve();
          }
        });
      }
    }).on("cycle", function(event) {
      console.log(" png " + String(event.target));
    }).on("complete", function() {
      callback(null, this.filter("fastest").pluck("name"));
    }).run();
  },
  webp: function(callback) {
    var inputWebpBuffer = fs.readFileSync(inputWebp);
    (new Benchmark.Suite("webp")).add("sharp-buffer-file", {
      defer: true,
      fn: function(deferred) {
        sharp(inputWebpBuffer).resize(width, height).toFile(outputWebp, function(err) {
          if (err) {
            throw err;
          } else {
            deferred.resolve();
          }
        });
      }
    }).add("sharp-buffer-buffer", {
      defer: true,
      fn: function(deferred) {
        sharp(inputWebpBuffer).resize(width, height).toBuffer(function(err, buffer) {
          if (err) {
            throw err;
          } else {
            assert.notStrictEqual(null, buffer);
            deferred.resolve();
          }
        });
      }
    }).add("sharp-file-file", {
      defer: true,
      fn: function(deferred) {
        sharp(inputWebp).resize(width, height).toFile(outputWebp, function(err) {
          if (err) {
            throw err;
          } else {
            deferred.resolve();
          }
        });
      }
    }).add("sharp-file-buffer", {
      defer: true,
      fn: function(deferred) {
        sharp(inputWebp).resize(width, height).toBuffer(function(err, buffer) {
          if (err) {
            throw err;
          } else {
            assert.notStrictEqual(null, buffer);
            deferred.resolve();
          }
        });
      }
    }).add("sharp-file-buffer-sharpen", {
      defer: true,
      fn: function(deferred) {
        sharp(inputWebp).resize(width, height).sharpen().toBuffer(function(err, buffer) {
          if (err) {
            throw err;
          } else {
            assert.notStrictEqual(null, buffer);
            deferred.resolve();
          }
        });
      }
    }).on("cycle", function(event) {
      console.log("webp " + String(event.target));
    }).on("complete", function() {
      callback(null, this.filter("fastest").pluck("name"));
    }).run();
  },
  tiff: function(callback) {
    (new Benchmark.Suite("tiff")).add("sharp-file-file", {
      defer: true,
      fn: function(deferred) {
        sharp(inputTiff).resize(width, height).toFile(outputTiff, function(err) {
          if (err) {
            throw err;
          } else {
            deferred.resolve();
          }
        });
      }
    }).add("sharp-file-file-sharpen", {
      defer: true,
      fn: function(deferred) {
        sharp(inputTiff).resize(width, height).sharpen().toFile(outputTiff, function(err) {
          if (err) {
            throw err;
          } else {
            deferred.resolve();
          }
        });
      }
    }).on("cycle", function(event) {
      console.log("tiff " + String(event.target));
    }).on("complete", function() {
      callback(null, this.filter("fastest").pluck("name"));
    }).run();
  },
  gif: function(callback) {
    (new Benchmark.Suite("gif")).add("sharp-file-file", {
      defer: true,
      fn: function(deferred) {
        sharp(inputGif).resize(width, height).toFile(outputTiff, function(err) {
          if (err) {
            throw err;
          } else {
            deferred.resolve();
          }
        });
      }
    }).add("sharp-file-file-sharpen", {
      defer: true,
      fn: function(deferred) {
        sharp(inputGif).resize(width, height).sharpen().toFile(outputTiff, function(err) {
          if (err) {
            throw err;
          } else {
            deferred.resolve();
          }
        });
      }
    }).add("sharp-file-file-sequentialRead", {
      defer: true,
      fn: function(deferred) {
        sharp(inputGif).sequentialRead().resize(width, height).toFile(outputTiff, function(err) {
          if (err) {
            throw err;
          } else {
            deferred.resolve();
          }
        });
      }
    }).on("cycle", function(event) {
      console.log("gif " + String(event.target));
    }).on("complete", function() {
      callback(null, this.filter("fastest").pluck("name"));
    }).run();
  }	
}, function(err, results) {
  assert(!err, err);
  Object.keys(results).forEach(function(format) {
    if (results[format].toString().substr(0, 5) !== "sharp") {
      console.log("sharp was slower than " + results[format] + " for " + format);
    }
  });
  console.dir(sharp.cache());
});
