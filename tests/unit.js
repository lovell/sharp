var sharp = require("../index");
var imagemagick = require("imagemagick");
var assert = require("assert");

var inputJpg = __dirname + "/2569067123_aca715a2ee_o.jpg"; // http://www.flickr.com/photos/grizdave/2569067123/
var outputJpg = __dirname + "/output.jpg";

sharp.resize(inputJpg, outputJpg, 320, 240, function(err) {
  if (err) throw err;
  imagemagick.identify(outputJpg, function(err, features) {
    if (err) throw err;
    assert.strictEqual(320, features.width);
    assert.strictEqual(240, features.height);

    sharp.resize(inputJpg, outputJpg, 320, -1, function(err) {
      if (err) throw err;
      imagemagick.identify(outputJpg, function(err, features) {
        if (err) throw err;
        assert.strictEqual(320, features.width);
        assert.strictEqual(262, features.height);
      });

      sharp.resize(inputJpg, outputJpg, -1, 320, function(err) {
        if (err) throw err;
        imagemagick.identify(outputJpg, function(err, features) {
          if (err) throw err;
          assert.strictEqual(392, features.width);
          assert.strictEqual(320, features.height);
        });
      });

    });
  });
});
