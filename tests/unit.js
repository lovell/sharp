var sharp = require("../index");
var imagemagick = require("imagemagick");
var assert = require("assert");
var async = require("async");

var inputJpg = __dirname + "/2569067123_aca715a2ee_o.jpg"; // http://www.flickr.com/photos/grizdave/2569067123/
var outputJpg = __dirname + "/output.jpg";

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
  }
]);
