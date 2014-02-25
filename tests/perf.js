var sharp = require("../index");
var fs = require("fs");
var imagemagick = require("imagemagick");
var gm = require("gm");
var epeg = require("epeg");
var async = require("async");
var assert = require("assert");
var Benchmark = require("benchmark");

var inputJpg = __dirname + "/2569067123_aca715a2ee_o.jpg"; // http://www.flickr.com/photos/grizdave/2569067123/
var outputJpg = __dirname + "/output.jpg";

var inputPng = __dirname + "/50020484-00001.png"; // http://c.searspartsdirect.com/lis_png/PLDM/50020484-00001.png
var outputPng = __dirname + "/output.png";

var inputWebp = __dirname + "/4.webp"; // http://www.gstatic.com/webp/gallery/4.webp
var outputWebp = __dirname + "/output.webp";

var inputTiff = __dirname + "/G31D.TIF"; // http://www.fileformat.info/format/tiff/sample/e6c9a6e5253348f4aef6d17b534360ab/index.htm
var outputTiff = __dirname + "/output.tiff";

var width = 720;
var height = 480;

async.series({
  jpeg: function(callback) {
    var inputJpgBuffer = fs.readFileSync(inputJpg);
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
    }).add("epeg-file-file", {
      defer: true,
      fn: function(deferred) {
        var image = new epeg.Image({path: inputJpg});
        image.downsize(width, height, 80).saveTo(outputJpg);
        deferred.resolve();
      }
    }).add("epeg-file-buffer", {
      defer: true,
      fn: function(deferred) {
        var image = new epeg.Image({path: inputJpg});
        var buffer = image.downsize(width, height, 80).process();
        assert.notStrictEqual(null, buffer);
        deferred.resolve();
      }
    }).add("sharp-buffer-file", {
      defer: true,
      fn: function(deferred) {
        sharp.resize(inputJpgBuffer, outputJpg, width, height, function(err) {
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
        sharp.resize(inputJpgBuffer, sharp.buffer.jpeg, width, height, function(err, buffer) {
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
        sharp.resize(inputJpg, outputJpg, width, height, function(err) {
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
        sharp.resize(inputJpg, sharp.buffer.jpeg, width, height, function(err, buffer) {
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
        sharp.resize(inputJpg, sharp.buffer.jpeg, width, height, {sharpen: true}, function(err, buffer) {
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
        sharp.resize(inputJpg, sharp.buffer.jpeg, width, height, {progressive: true}, function(err, buffer) {
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
        sharp.resize(inputJpg, sharp.buffer.jpeg, width, height, {sequentialRead: true}, function(err, buffer) {
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
        sharp.resize(inputPngBuffer, outputPng, width, height, function(err) {
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
        sharp.resize(inputPngBuffer, sharp.buffer.png, width, height, function(err, buffer) {
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
        sharp.resize(inputPng, outputPng, width, height, function(err) {
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
        sharp.resize(inputPng, sharp.buffer.png, width, height, function(err, buffer) {
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
        sharp.resize(inputPng, sharp.buffer.png, width, height, {sharpen: true}, function(err, buffer) {
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
        sharp.resize(inputPng, sharp.buffer.png, width, height, {progressive: true}, function(err, buffer) {
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
        sharp.resize(inputPng, sharp.buffer.png, width, height, {sequentialRead: true}, function(err, buffer) {
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
        sharp.resize(inputWebpBuffer, outputWebp, width, height, function(err) {
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
        sharp.resize(inputWebpBuffer, sharp.buffer.webp, width, height, function(err, buffer) {
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
        sharp.resize(inputWebp, outputWebp, width, height, function(err) {
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
        sharp.resize(inputWebp, sharp.buffer.webp, width, height, function(err, buffer) {
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
        sharp.resize(inputWebp, sharp.buffer.webp, width, height, {sharpen: true}, function(err, buffer) {
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
        sharp.resize(inputWebp, sharp.buffer.webp, width, height, {sequentialRead: true}, function(err, buffer) {
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
        sharp.resize(inputTiff, outputTiff, width, height, function(err) {
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
        sharp.resize(inputTiff, outputTiff, width, height, {sharpen: true}, function(err) {
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
        sharp.resize(inputTiff, outputTiff, width, height, {sequentialRead: true}, function(err) {
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
  }	
}, function(err, results) {
  assert(!err, err);
  Object.keys(results).forEach(function(format) {
    assert.strictEqual("sharp", results[format].toString().substr(0, 5), "sharp was slower than " + results[format] + " for " + format);
  });
  console.dir(sharp.cache());
});
