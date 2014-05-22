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

async.series([
  // Resize with exact crop
  function(done) {
    sharp(inputJpg).resize(320, 240).write(outputJpg, function(err) {
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
    sharp(inputJpg).resize(320).write(outputJpg, function(err) {
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
    sharp(inputJpg).resize(null, 320).write(outputJpg, function(err) {
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
    sharp(inputJpg).write(outputJpg, function(err) {
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
    sharp(inputJpg).resize(3000).write(outputJpg, function(err) {
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
    sharp(inputJpg).resize(320, 240).quality(70).jpeg(function(err, buffer70) {
      if (err) throw err;
      sharp(inputJpg).resize(320, 240).jpeg(function(err, buffer80) {
        if (err) throw err;
        sharp(inputJpg).resize(320, 240).quality(90).jpeg(function(err, buffer90) {
          assert(buffer70.length < buffer80.length);
          assert(buffer80.length < buffer90.length);
          done();
        });
      });
    });
  },
  // TIFF with dimensions known to cause rounding errors
  function(done) {
    sharp(inputTiff).resize(240, 320).embedBlack().write(outputJpg, function(err) {
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
    sharp(inputTiff).resize(240, 320).write(outputJpg, function(err) {
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
    sharp(inputJpg).resize(320, 320).max().write(outputJpg, function(err) {
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
    sharp(inputTiff).resize(320, 320).max().write(outputJpg, function(err) {
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
    sharp(inputJpg).resize(320).max().write(outputJpg, function(err) {
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
    sharp(inputJpg).write(inputJpg, function(err) {
      assert(!!err);
      done();
    });
  }
]);
