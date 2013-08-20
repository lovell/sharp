var sharp = require("../index");
var imagemagick = require("imagemagick");
var assert = require("assert");

// http://www.flickr.com/photos/grizdave/2569067123/
var input = __dirname + "/2569067123_aca715a2ee_o.jpg";
var output = __dirname + "/output.jpg";

var width = 640;
var height = 480;

// imagemagick
var time = process.hrtime();
imagemagick.resize({
  srcPath: input,
  dstPath: output,
  quality: 0.75,
  width: width,
  height: height
}, function(err) {
  if (err) {
    throw err;
  }
  var diff = process.hrtime(time);
  imagemagickTime = diff[0] * 1e9 + diff[1];
  console.log("imagemagick took %d nanoseconds", imagemagickTime);

  // sharp
  time = process.hrtime();
  sharp.crop(input, output, width, height, function(err) {
    if (err) {
      throw err;
    }
    diff = process.hrtime(time);
	var sharpTime = diff[0] * 1e9 + diff[1];
    console.log("sharp took %d nanoseconds", sharpTime);

	// diff
	assert(sharpTime < imagemagickTime, "sharp was blunt");
	console.log("sharp was %d%% faster", (imagemagickTime - sharpTime) / imagemagickTime * 100);
  });
});
