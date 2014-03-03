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

var min = 320;
var max = 960;

var randomDimension = function() {
  return Math.random() * (max - min) + min;
};

new Benchmark.Suite("random").add("imagemagick", {
	defer: true,
	fn: function(deferred) {
		imagemagick.resize({
			srcPath: inputJpg,
			dstPath: outputJpg,
			quality: 0.8,
			width: randomDimension(),
			height: randomDimension()
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
		gm(inputJpg).resize(randomDimension(), randomDimension()).quality(80).toBuffer(function (err, buffer) {
			if (err) {
				throw err;
			} else {
				assert.notStrictEqual(null, buffer);
				deferred.resolve();
			}
		});
	}
}).add("epeg", {
	defer: true,
	fn: function(deferred) {
		var image = new epeg.Image({path: inputJpg});
		var buffer = image.downsize(randomDimension(), randomDimension(), 80).process();
		assert.notStrictEqual(null, buffer);
		deferred.resolve();
	}
}).add("sharp", {
	defer: true,
	fn: function(deferred) {
		sharp.resize(inputJpg, sharp.buffer.jpeg, randomDimension(), randomDimension(), function(err, buffer) {
			if (err) {
				throw err;
			} else {
				assert.notStrictEqual(null, buffer);
				deferred.resolve();
			}
		});
	}
}).on("cycle", function(event) {
  console.log(String(event.target));
}).on("complete", function() {
  var winner = this.filter("fastest").pluck("name");
  assert.strictEqual("sharp", String(winner), "sharp was slower than " + winner);
	console.dir(sharp.cache());
}).run();
