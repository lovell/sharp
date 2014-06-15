/*jslint node: true */
/*jslint es5: true */
'use strict';

var sharp = require("../index");
var path = require("path");
var imagemagick = require("imagemagick");
var assert = require("assert");
var async = require("async");

var fixturesPath = path.join(__dirname, "fixtures");

var inputJpg = path.join(fixturesPath, "2569067123_aca715a2ee_o.jpg"); // http://www.flickr.com/photos/grizdave/2569067123/
var outputJpg = path.join(fixturesPath, "output.jpg");

var inputTiff = path.join(fixturesPath, "G31D.TIF"); // http://www.fileformat.info/format/tiff/sample/e6c9a6e5253348f4aef6d17b534360ab/index.htm
var outputTiff = path.join(fixturesPath, "output.tiff");

var inputJpgWithExif = path.join(fixturesPath, "Landscape_8.jpg"); // https://github.com/recurser/exif-orientation-examples/blob/master/Landscape_8.jpg

async.series([
  // Resize with exact crop
  function(done) {
    sharp(inputJpg).resize(320, 240).toFile(outputJpg, function(err) {
      if (err) throw err;
      imagemagick.identify(outputJpg, function(err, features) {
        if (err) throw err;
        assert.strictEqual(320, features.width);
        assert.strictEqual(240, features.height);
        done();
      });
    });
  },
  // Resize to fixed width
  function(done) {
    sharp(inputJpg).resize(320).toFile(outputJpg, function(err) {
      if (err) throw err;
      imagemagick.identify(outputJpg, function(err, features) {
        if (err) throw err;
        assert.strictEqual(320, features.width);
        assert.strictEqual(261, features.height);
        done();
      });
    });
  },
  // Resize to fixed height
  function(done) {
    sharp(inputJpg).resize(null, 320).toFile(outputJpg, function(err) {
      if (err) throw err;
      imagemagick.identify(outputJpg, function(err, features) {
        if (err) throw err;
        assert.strictEqual(391, features.width);
        assert.strictEqual(320, features.height);
        done();
      });
    });
  },
  // Identity transform
  function(done) {
    sharp(inputJpg).toFile(outputJpg, function(err) {
      if (err) throw err;
      imagemagick.identify(outputJpg, function(err, features) {
        if (err) throw err;
        assert.strictEqual(2725, features.width);
        assert.strictEqual(2225, features.height);
        done();
      });
    });
  },
  // Upscale
  function(done) {
    sharp(inputJpg).resize(3000).toFile(outputJpg, function(err) {
      if (err) throw err;
      imagemagick.identify(outputJpg, function(err, features) {
        if (err) throw err;
        assert.strictEqual(3000, features.width);
        assert.strictEqual(2449, features.height);
        done();
      });
    });
  },
  // Quality
  function(done) {
    sharp(inputJpg).resize(320, 240).quality(70).format('jpeg').toBuffer(function(err, buffer70) {
      if (err) throw err;
      sharp(inputJpg).resize(320, 240).format('jpeg').toBuffer(function(err, buffer80) {
        if (err) throw err;
        sharp(inputJpg).resize(320, 240).quality(90).format('jpeg').toBuffer(function(err, buffer90) {
          assert(buffer70.length < buffer80.length);
          assert(buffer80.length < buffer90.length);
          done();
        });
      });
    });
  },
  // TIFF with dimensions known to cause rounding errors
  function(done) {
    sharp(inputTiff).resize(240, 320).embedBlack().toFile(outputJpg, function(err) {
      if (err) throw err;
      imagemagick.identify(outputJpg, function(err, features) {
        if (err) throw err;
        assert.strictEqual(240, features.width);
        assert.strictEqual(320, features.height);
        done();
      });
    });
  },
  function(done) {
    sharp(inputTiff).resize(240, 320).toFile(outputJpg, function(err) {
      if (err) throw err;
      imagemagick.identify(outputJpg, function(err, features) {
        if (err) throw err;
        assert.strictEqual(240, features.width);
        assert.strictEqual(320, features.height);
        done();
      });
    });
  },
  // Resize to max width or height considering ratio (landscape)
  function(done) {
    sharp(inputJpg).resize(320, 320).max().toFile(outputJpg, function(err) {
      if (err) throw err;
      imagemagick.identify(outputJpg, function(err, features) {
        if (err) throw err;
        assert.strictEqual(320, features.width);
        assert.strictEqual(261, features.height);
        done();
      });
    });
  },
  // Resize to max width or height considering ratio (portrait)
  function(done) {
    sharp(inputTiff).resize(320, 320).max().toFile(outputJpg, function(err) {
      if (err) throw err;
      imagemagick.identify(outputJpg, function(err, features) {
        if (err) throw err;
        assert.strictEqual(243, features.width);
        assert.strictEqual(320, features.height);
        done();
      });
    });
  },
  // Attempt to resize to max but only provide one dimension, so should default to crop
  function(done) {
    sharp(inputJpg).resize(320).max().toFile(outputJpg, function(err) {
      if (err) throw err;
      imagemagick.identify(outputJpg, function(err, features) {
        if (err) throw err;
        assert.strictEqual(320, features.width);
        assert.strictEqual(261, features.height);
        done();
      });
    });
  },
  // Attempt to output to input, should fail
  function(done) {
    sharp(inputJpg).toFile(inputJpg, function(err) {
      assert(!!err);
      done();
    });
  },
  // Rotate by 90 degrees, respecting output input size
  function(done) {
    sharp(inputJpg).rotate(90).resize(320, 240).toFile(outputJpg, function(err) {
      if (err) throw err;
      imagemagick.identify(outputJpg, function(err, features) {
        if (err) throw err;
        assert.strictEqual(320, features.width);
        assert.strictEqual(240, features.height);
        done();
      });
    });
  },
  // Input image has Orientation EXIF tag but do not rotate output
  function(done) {
    sharp(inputJpgWithExif).resize(320).toFile(outputJpg, function(err) {
      if (err) throw err;
      imagemagick.identify(outputJpg, function(err, features) {
        if (err) throw err;
        assert.strictEqual(320, features.width);
        assert.strictEqual(426, features.height);
        done();
      });
    });
  },
  // Input image has Orientation EXIF tag value of 8 (270 degrees), auto-rotate
  function(done) {
    sharp(inputJpgWithExif).rotate().resize(320).toFile(outputJpg, function(err) {
      if (err) throw err;
      imagemagick.identify(outputJpg, function(err, features) {
        if (err) throw err;
        assert.strictEqual(320, features.width);
        assert.strictEqual(240, features.height);
        done();
      });
    });
  },
  // Attempt to auto-rotate using image that has no EXIF
  function(done) {
    sharp(inputJpg).rotate().resize(320).toFile(outputJpg, function(err) {
      if (err) throw err;
      imagemagick.identify(outputJpg, function(err, features) {
        if (err) throw err;
        assert.strictEqual(320, features.width);
        assert.strictEqual(261, features.height);
        done();
      });
    });
  },
  // Rotate to an invalid angle, should fail
  function(done) {
    var fail = false;
    try {
      sharp(inputJpg).rotate(1);
      fail = true;
    } catch (e) {}
    assert(!fail);
    done();
  },
  // Do not enlarge the output if the input width is already less than the output width
  function(done) {
    sharp(inputJpg).resize(2800).withoutEnlargement().toFile(outputJpg, function(err) {
      if (err) throw err;
      imagemagick.identify(outputJpg, function(err, features) {
        if (err) throw err;
        assert.strictEqual(2725, features.width);
        assert.strictEqual(2225, features.height);
        done();
      });
    });
  },
  // Do not enlarge the output if the input height is already less than the output height
  function(done) {
    sharp(inputJpg).resize(null, 2300).withoutEnlargement().toFile(outputJpg, function(err) {
      if (err) throw err;
      imagemagick.identify(outputJpg, function(err, features) {
        if (err) throw err;
        assert.strictEqual(2725, features.width);
        assert.strictEqual(2225, features.height);
        done();
      });
    });
  },
  // Promises/A+
  function(done) {
    sharp(inputJpg).resize(320, 240).toFile(outputJpg).then(function() {
      imagemagick.identify(outputJpg, function(err, features) {
        assert.strictEqual(320, features.width);
        assert.strictEqual(240, features.height);
        done();
      });
    }).catch(function(err) {
      throw err;
    });
  },
  // Empty Buffer, should fail
  function(done) {
    var fail = false;
    try {
      sharp(new Buffer(0));
      fail = true;
    } catch (e) {}
    assert(!fail);
    done();
  },
  // Check colour space conversion occurs from TIFF to WebP (this used to segfault)
  function(done) {
    sharp(inputTiff).format('webp').toBuffer(function() {
      done();
    });
  },
  // Interpolation: bilinear
  function(done) {
    sharp(inputJpg).resize(320, 240).bilinearInterpolation().toFile(outputJpg, function(err) {
      if (err) throw err;
      imagemagick.identify(outputJpg, function(err, features) {
        if (err) throw err;
        assert.strictEqual(320, features.width);
        assert.strictEqual(240, features.height);
        done();
      });
    });
  },
  // Interpolation: bicubic
  function(done) {
    sharp(inputJpg).resize(320, 240).bicubicInterpolation().toFile(outputJpg, function(err) {
      if (err) throw err;
      imagemagick.identify(outputJpg, function(err, features) {
        if (err) throw err;
        assert.strictEqual(320, features.width);
        assert.strictEqual(240, features.height);
        done();
      });
    });
  },
  // Interpolation: nohalo
  function(done) {
    sharp(inputJpg).resize(320, 240).nohaloInterpolation().toFile(outputJpg, function(err) {
      if (err) throw err;
      imagemagick.identify(outputJpg, function(err, features) {
        if (err) throw err;
        assert.strictEqual(320, features.width);
        assert.strictEqual(240, features.height);
        done();
      });
    });
  },
  // Set unsupported format, fail!
  function(done) {
    var fail = false;
    try {
      sharp(inputJpg).format('exe');
      fail = true;
    } catch (e) {}
    assert(!fail);
    done();
  }, 
  // Set supported format!
  function(done) {
    var format = 'png';
    var inst = sharp(inputJpg).format(format);
    assert(inst.options.output == "__" + format);
    done();
  }, 
]);
