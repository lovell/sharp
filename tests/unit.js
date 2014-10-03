/*jslint node: true */
/*jslint es5: true */
'use strict';

var sharp = require('../index');
var fs = require('fs');
var path = require('path');
var assert = require('assert');
var async = require('async');

var fixturesPath = path.join(__dirname, 'fixtures');

var inputJpg = path.join(fixturesPath, '2569067123_aca715a2ee_o.jpg'); // http://www.flickr.com/photos/grizdave/2569067123/
var inputJpgWithExif = path.join(fixturesPath, 'Landscape_8.jpg'); // https://github.com/recurser/exif-orientation-examples/blob/master/Landscape_8.jpg
var inputJpgWithGammaHoliness = path.join(fixturesPath, 'gamma_dalai_lama_gray.jpg'); // http://www.4p8.com/eric.brasseur/gamma.html

var inputPng = path.join(fixturesPath, '50020484-00001.png'); // http://c.searspartsdirect.com/lis_png/PLDM/50020484-00001.png
var inputPngWithTransparency = path.join(fixturesPath, 'blackbug.png'); // public domain

var inputWebP = path.join(fixturesPath, '4.webp'); // http://www.gstatic.com/webp/gallery/4.webp
var inputTiff = path.join(fixturesPath, 'G31D.TIF'); // http://www.fileformat.info/format/tiff/sample/e6c9a6e5253348f4aef6d17b534360ab/index.htm
var inputGif = path.join(fixturesPath, 'Crash_test.gif'); // http://upload.wikimedia.org/wikipedia/commons/e/e3/Crash_test.gif

var outputJpg = path.join(fixturesPath, 'output.jpg');
var outputZoinks = path.join(fixturesPath, 'output.zoinks'); // an 'unknown' file extension

// Ensure cache limits can be set
sharp.cache(0); // Disable
sharp.cache(50, 500); // 50MB, 500 items

// Ensure concurrency can be set
var defaultConcurrency = sharp.concurrency();
sharp.concurrency(16);
assert.strictEqual(16, sharp.concurrency());
sharp.concurrency(0);
assert.strictEqual(defaultConcurrency, sharp.concurrency());

async.series([
  // Resize with exact crop
  function(done) {
    sharp(inputJpg).resize(320, 240).toBuffer(function(err, data, info) {
      if (err) throw err;
      assert.strictEqual(true, data.length > 0);
      assert.strictEqual('jpeg', info.format);
      assert.strictEqual(320, info.width);
      assert.strictEqual(240, info.height);
      done();
    });
  },
  // Resize to fixed width
  function(done) {
    sharp(inputJpg).resize(320).toBuffer(function(err, data, info) {
      if (err) throw err;
      assert.strictEqual(true, data.length > 0);
      assert.strictEqual('jpeg', info.format);
      assert.strictEqual(320, info.width);
      assert.strictEqual(261, info.height);
      done();
    });
  },
  // Resize to fixed height
  function(done) {
    sharp(inputJpg).resize(null, 320).toBuffer(function(err, data, info) {
      if (err) throw err;
      assert.strictEqual(true, data.length > 0);
      assert.strictEqual('jpeg', info.format);
      assert.strictEqual(391, info.width);
      assert.strictEqual(320, info.height);
      done();
    });
  },
  // Identity transform
  function(done) {
    sharp(inputJpg).toBuffer(function(err, data, info) {
      if (err) throw err;
      assert.strictEqual(true, data.length > 0);
      assert.strictEqual('jpeg', info.format);
      assert.strictEqual(2725, info.width);
      assert.strictEqual(2225, info.height);
      done();
    });
  },
  // Upscale
  function(done) {
    sharp(inputJpg).resize(3000).toBuffer(function(err, data, info) {
      if (err) throw err;
      assert.strictEqual(true, data.length > 0);
      assert.strictEqual('jpeg', info.format);
      assert.strictEqual(3000, info.width);
      assert.strictEqual(2449, info.height);
      done();
    });
  },
  // Embed - JPEG within PNG, no alpha channel
  function(done) {
    sharp(inputJpg)
      .embed()
      .resize(320, 240)
      .png()
      .toBuffer(function(err, data, info) {
        if (err) throw err;
        assert.strictEqual(true, data.length > 0);
        assert.strictEqual('png', info.format);
        assert.strictEqual(320, info.width);
        assert.strictEqual(240, info.height);
        sharp(data).metadata(function(err, metadata) {
          if (err) throw err;
          assert.strictEqual(3, metadata.channels);
          done();
        });
      });
  },
  // Embed - JPEG within WebP, to include alpha channel
  function(done) {
    sharp(inputJpg)
      .resize(320, 240)
      .background({r: 0, g: 0, b: 0, a: 0})
      .embed()
      .webp()
      .toBuffer(function(err, data, info) {
        if (err) throw err;
        assert.strictEqual(true, data.length > 0);
        assert.strictEqual('webp', info.format);
        assert.strictEqual(320, info.width);
        assert.strictEqual(240, info.height);
        sharp(data).metadata(function(err, metadata) {
          if (err) throw err;
          assert.strictEqual(4, metadata.channels);
          done();
        });
      });
  },
  // Quality
  function(done) {
    sharp(inputJpg).resize(320, 240).quality(70).toBuffer(function(err, buffer70) {
      if (err) throw err;
      sharp(inputJpg).resize(320, 240).toBuffer(function(err, buffer80) {
        if (err) throw err;
        sharp(inputJpg).resize(320, 240).quality(90).toBuffer(function(err, buffer90) {
          if (err) throw err;
          assert(buffer70.length < buffer80.length);
          assert(buffer80.length < buffer90.length);
          done();
        });
      });
    });
  },
  // TIFF with dimensions known to cause rounding errors
  function(done) {
    sharp(inputTiff).resize(240, 320).embed().jpeg().toBuffer(function(err, data, info) {
      if (err) throw err;
      assert.strictEqual(true, data.length > 0);
      assert.strictEqual('jpeg', info.format);
      assert.strictEqual(240, info.width);
      assert.strictEqual(320, info.height);
      done();
    });
  },
  function(done) {
    sharp(inputTiff).resize(240, 320).jpeg().toBuffer(function(err, data, info) {
      if (err) throw err;
      assert.strictEqual(true, data.length > 0);
      assert.strictEqual('jpeg', info.format);
      assert.strictEqual(240, info.width);
      assert.strictEqual(320, info.height);
      done();
    });
  },
  // Resize to max width or height considering ratio (landscape)
  function(done) {
    sharp(inputJpg).resize(320, 320).max().toBuffer(function(err, data, info) {
      if (err) throw err;
      assert.strictEqual(true, data.length > 0);
      assert.strictEqual('jpeg', info.format);
      assert.strictEqual(320, info.width);
      assert.strictEqual(261, info.height);
      done();
    });
  },
  // Resize to max width or height considering ratio (portrait)
  function(done) {
    sharp(inputTiff).resize(320, 320).max().jpeg().toBuffer(function(err, data, info) {
      if (err) throw err;
      assert.strictEqual(true, data.length > 0);
      assert.strictEqual('jpeg', info.format);
      assert.strictEqual(243, info.width);
      assert.strictEqual(320, info.height);
      done();
    });
  },
  // Attempt to resize to max but only provide one dimension, so should default to crop
  function(done) {
    sharp(inputJpg).resize(320).max().toBuffer(function(err, data, info) {
      if (err) throw err;
      assert.strictEqual(true, data.length > 0);
      assert.strictEqual('jpeg', info.format);
      assert.strictEqual(320, info.width);
      assert.strictEqual(261, info.height);
      done();
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
    sharp(inputJpg).rotate(90).resize(320, 240).toBuffer(function(err, data, info) {
      if (err) throw err;
      assert.strictEqual(true, data.length > 0);
      assert.strictEqual('jpeg', info.format);
      assert.strictEqual(320, info.width);
      assert.strictEqual(240, info.height);
      done();
    });
  },
  // Input image has Orientation EXIF tag but do not rotate output
  function(done) {
    sharp(inputJpgWithExif).resize(320).toBuffer(function(err, data, info) {
      if (err) throw err;
      assert.strictEqual(true, data.length > 0);
      assert.strictEqual('jpeg', info.format);
      assert.strictEqual(320, info.width);
      assert.strictEqual(426, info.height);
      done();
    });
  },
  // Input image has Orientation EXIF tag value of 8 (270 degrees), auto-rotate
  function(done) {
    sharp(inputJpgWithExif).rotate().resize(320).toBuffer(function(err, data, info) {
      if (err) throw err;
      assert.strictEqual(true, data.length > 0);
      assert.strictEqual('jpeg', info.format);
      assert.strictEqual(320, info.width);
      assert.strictEqual(240, info.height);
      done();
    });
  },
  // Attempt to auto-rotate using image that has no EXIF
  function(done) {
    sharp(inputJpg).rotate().resize(320).toBuffer(function(err, data, info) {
      if (err) throw err;
      assert.strictEqual(true, data.length > 0);
      assert.strictEqual('jpeg', info.format);
      assert.strictEqual(320, info.width);
      assert.strictEqual(261, info.height);
      done();
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
    sharp(inputJpg).resize(2800).withoutEnlargement().toBuffer(function(err, data, info) {
      if (err) throw err;
      assert.strictEqual(true, data.length > 0);
      assert.strictEqual('jpeg', info.format);
      assert.strictEqual(2725, info.width);
      assert.strictEqual(2225, info.height);
      done();
    });
  },
  // Do not enlarge the output if the input height is already less than the output height
  function(done) {
    sharp(inputJpg).resize(null, 2300).withoutEnlargement().toBuffer(function(err, data, info) {
      if (err) throw err;
      assert.strictEqual(true, data.length > 0);
      assert.strictEqual('jpeg', info.format);
      assert.strictEqual(2725, info.width);
      assert.strictEqual(2225, info.height);
      done();
    });
  },
  // Promises/A+
  function(done) {
    sharp(inputJpg).resize(320, 240).toBuffer().then(function(data) {
      sharp(data).toBuffer(function(err, data, info) {
        if (err) throw err;
        assert.strictEqual(true, data.length > 0);
        assert.strictEqual('jpeg', info.format);
        assert.strictEqual(320, info.width);
        assert.strictEqual(240, info.height);
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
    sharp(inputTiff).webp().toBuffer(function(err, data, info) {
      if (err) throw err;
      assert.strictEqual(true, data.length > 0);
      assert.strictEqual('webp', info.format);
      done();
    });
  },
  // Interpolation: nearest neighbour
  function(done) {
    sharp(inputJpg).resize(320, 240).interpolateWith(sharp.interpolator.nearest).toBuffer(function(err, data, info) {
      if (err) throw err;
      assert.strictEqual(true, data.length > 0);
      assert.strictEqual('jpeg', info.format);
      assert.strictEqual(320, info.width);
      assert.strictEqual(240, info.height);
      done();
    });
  },
  // Interpolation: bilinear
  function(done) {
    sharp(inputJpg).resize(320, 240).interpolateWith(sharp.interpolator.bilinear).toBuffer(function(err, data, info) {
      if (err) throw err;
      assert.strictEqual(true, data.length > 0);
      assert.strictEqual('jpeg', info.format);
      assert.strictEqual(320, info.width);
      assert.strictEqual(240, info.height);
      done();
    });
  },
  // Interpolation: bicubic
  function(done) {
    sharp(inputJpg).resize(320, 240).interpolateWith(sharp.interpolator.bicubic).toBuffer(function(err, data, info) {
      if (err) throw err;
      assert.strictEqual(true, data.length > 0);
      assert.strictEqual('jpeg', info.format);
      assert.strictEqual(320, info.width);
      assert.strictEqual(240, info.height);
      done();
    });
  },
  // Interpolation: nohalo
  function(done) {
    sharp(inputJpg).resize(320, 240).interpolateWith(sharp.interpolator.nohalo).toBuffer(function(err, data, info) {
      if (err) throw err;
      assert.strictEqual(true, data.length > 0);
      assert.strictEqual('jpeg', info.format);
      assert.strictEqual(320, info.width);
      assert.strictEqual(240, info.height);
      done();
    });
  },
  // Interpolation: locally bounded bicubic (LBB)
  function(done) {
    sharp(inputJpg).resize(320, 240).interpolateWith(sharp.interpolator.locallyBoundedBicubic).toBuffer(function(err, data, info) {
      if (err) throw err;
      assert.strictEqual(true, data.length > 0);
      assert.strictEqual('jpeg', info.format);
      assert.strictEqual(320, info.width);
      assert.strictEqual(240, info.height);
      done();
    });
  },
  // Interpolation: vertex split quadratic basis spline (VSQBS)
  function(done) {
    sharp(inputJpg).resize(320, 240).interpolateWith(sharp.interpolator.vertexSplitQuadraticBasisSpline).toBuffer(function(err, data, info) {
      if (err) throw err;
      assert.strictEqual(true, data.length > 0);
      assert.strictEqual('jpeg', info.format);
      assert.strictEqual(320, info.width);
      assert.strictEqual(240, info.height);
      done();
    });
  },
  // File-Stream
  function(done) {
    var writable = fs.createWriteStream(outputJpg);
    writable.on('finish', function() {
      sharp(outputJpg).toBuffer(function(err, data, info) {
        if (err) throw err;
        assert.strictEqual(true, data.length > 0);
        assert.strictEqual('jpeg', info.format);
        assert.strictEqual(320, info.width);
        assert.strictEqual(240, info.height);
        fs.unlinkSync(outputJpg);
        done();
      });
    });
    sharp(inputJpg).resize(320, 240).pipe(writable);
  },
  // Buffer-Stream
  function(done) {
    var inputJpgBuffer = fs.readFileSync(inputJpg);
    var writable = fs.createWriteStream(outputJpg);
    writable.on('finish', function() {
      sharp(outputJpg).toBuffer(function(err, data, info) {
        if (err) throw err;
        assert.strictEqual(true, data.length > 0);
        assert.strictEqual('jpeg', info.format);
        assert.strictEqual(320, info.width);
        assert.strictEqual(240, info.height);
        fs.unlinkSync(outputJpg);
        done();
      });
    });
    sharp(inputJpgBuffer).resize(320, 240).pipe(writable);
  },
  // Stream-File
  function(done) {
    var readable = fs.createReadStream(inputJpg);
    var pipeline = sharp().resize(320, 240).toFile(outputJpg, function(err, info) {
      if (err) throw err;
      assert.strictEqual('jpeg', info.format);
      assert.strictEqual(320, info.width);
      assert.strictEqual(240, info.height);
      fs.unlinkSync(outputJpg);
      done();
    });
    readable.pipe(pipeline);
  },
  // Stream-Buffer
  function(done) {
    var readable = fs.createReadStream(inputJpg);
    var pipeline = sharp().resize(320, 240).toBuffer(function(err, data, info) {
      if (err) throw err;
      assert.strictEqual(true, data.length > 0);
      assert.strictEqual('jpeg', info.format);
      assert.strictEqual(320, info.width);
      assert.strictEqual(240, info.height);
      done();
    });
    readable.pipe(pipeline);
  },
  // Stream-Stream
  function(done) {
    var readable = fs.createReadStream(inputJpg);
    var writable = fs.createWriteStream(outputJpg);
    writable.on('finish', function() {
      sharp(outputJpg).toBuffer(function(err, data, info) {
        if (err) throw err;
        assert.strictEqual(true, data.length > 0);
        assert.strictEqual('jpeg', info.format);
        assert.strictEqual(320, info.width);
        assert.strictEqual(240, info.height);
        fs.unlinkSync(outputJpg);
        done();
      });
    });
    var pipeline = sharp().resize(320, 240);
    readable.pipe(pipeline).pipe(writable);
  },
  // Stream-Stream error handling
  function(done) {
    var pipeline = sharp().resize(320, 240);
    var anErrorWasEmitted = false;
    pipeline.on('error', function(err) {
      anErrorWasEmitted = !!err;
    }).on('end', function() {
      assert(anErrorWasEmitted);
      fs.unlinkSync(outputJpg);
      done();
    });
    var readableButNotAnImage = fs.createReadStream(__filename);
    var writable = fs.createWriteStream(outputJpg);
    readableButNotAnImage.pipe(pipeline).pipe(writable);
  },
  // File-Stream error handling
  function(done) {
    var readableButNotAnImage = sharp(__filename).resize(320, 240);
    var anErrorWasEmitted = false;
    readableButNotAnImage.on('error', function(err) {
      anErrorWasEmitted = !!err;
    }).on('end', function() {
      assert(anErrorWasEmitted);
      fs.unlinkSync(outputJpg);
      done();
    });
    var writable = fs.createWriteStream(outputJpg);
    readableButNotAnImage.pipe(writable);
  },
  // Crop, gravity=north
  function(done) {
    sharp(inputJpg).resize(320, 80).crop(sharp.gravity.north).toFile(path.join(fixturesPath, 'output.gravity-north.jpg'), function(err, info) {
      if (err) throw err;
      assert.strictEqual(320, info.width);
      assert.strictEqual(80, info.height);
      done();
    });
  },
  // Crop, gravity=east
  function(done) {
    sharp(inputJpg).resize(80, 320).crop(sharp.gravity.east).toFile(path.join(fixturesPath, 'output.gravity-east.jpg'), function(err, info) {
      if (err) throw err;
      assert.strictEqual(80, info.width);
      assert.strictEqual(320, info.height);
      done();
    });
  },
  // Crop, gravity=south
  function(done) {
    sharp(inputJpg).resize(320, 80).crop(sharp.gravity.south).toFile(path.join(fixturesPath, 'output.gravity-south.jpg'), function(err, info) {
      if (err) throw err;
      assert.strictEqual(320, info.width);
      assert.strictEqual(80, info.height);
      done();
    });
  },
  // Crop, gravity=west
  function(done) {
    sharp(inputJpg).resize(80, 320).crop(sharp.gravity.west).toFile(path.join(fixturesPath, 'output.gravity-west.jpg'), function(err, info) {
      if (err) throw err;
      assert.strictEqual(80, info.width);
      assert.strictEqual(320, info.height);
      done();
    });
  },
  // Crop, gravity=center
  function(done) {
    sharp(inputJpg).resize(320, 80).crop(sharp.gravity.center).toFile(path.join(fixturesPath, 'output.gravity-center.jpg'), function(err, info) {
      if (err) throw err;
      assert.strictEqual(320, info.width);
      assert.strictEqual(80, info.height);
      done();
    });
  },
  // Crop, gravity=centre
  function(done) {
    sharp(inputJpg).resize(80, 320).crop(sharp.gravity.centre).toFile(path.join(fixturesPath, 'output.gravity-centre.jpg'), function(err, info) {
      if (err) throw err;
      assert.strictEqual(80, info.width);
      assert.strictEqual(320, info.height);
      done();
    });
  },
  // Keeps Metadata after a resize
  function(done) {
      sharp(inputJpgWithExif).resize(320, 240).withMetadata().toBuffer(function(err, buffer) {
          if (err) throw err;
          sharp(buffer).metadata(function(err, metadata) {
              if (err) throw err;
              assert.strictEqual(8, metadata.orientation);
              done();
          });
      });
  },
  // Keeps Metadata after a resize
  function(done) {
      sharp(inputJpgWithExif).resize(320, 240).withMetadata(false).toBuffer(function(err, buffer) {
          if (err) throw err;
          sharp(buffer).metadata(function(err, metadata) {
              if (err) throw err;
              assert.strictEqual('undefined', typeof metadata.orientation);
              done();
          });
      });
  },
  // Output filename without extension should mirror input format
  function(done) {
    sharp(inputJpg).resize(320, 80).toFile(outputZoinks, function(err, info) {
      if (err) throw err;
      assert.strictEqual('jpeg', info.format);
      assert.strictEqual(320, info.width);
      assert.strictEqual(80, info.height);
      fs.unlinkSync(outputZoinks);
      done();
    });
  },
  function(done) {
    sharp(inputPng).resize(320, 80).toFile(outputZoinks, function(err, info) {
      if (err) throw err;
      assert.strictEqual('png', info.format);
      assert.strictEqual(320, info.width);
      assert.strictEqual(80, info.height);
      fs.unlinkSync(outputZoinks);
      done();
    });
  },
  function(done) {
    sharp(inputPngWithTransparency).resize(320, 80).toFile(outputZoinks, function(err, info) {
      if (err) throw err;
      assert.strictEqual('png', info.format);
      assert.strictEqual(320, info.width);
      assert.strictEqual(80, info.height);
      done();
    });
  },
  function(done) {
    sharp(inputWebP).resize(320, 80).toFile(outputZoinks, function(err, info) {
      if (err) throw err;
      assert.strictEqual('webp', info.format);
      assert.strictEqual(320, info.width);
      assert.strictEqual(80, info.height);
      fs.unlinkSync(outputZoinks);
      done();
    });
  },
  function(done) {
    sharp(inputTiff).resize(320, 80).toFile(outputZoinks, function(err, info) {
      if (err) throw err;
      assert.strictEqual('tiff', info.format);
      assert.strictEqual(320, info.width);
      assert.strictEqual(80, info.height);
      fs.unlinkSync(outputZoinks);
      done();
    });
  },
  function(done) {
    sharp(inputGif).resize(320, 80).toFile(outputZoinks, function(err) {
      assert(!!err);
      done();
    });
  },
  // Metadata - JPEG
  function(done) {
    sharp(inputJpg).metadata(function(err, metadata) {
      if (err) throw err;
      assert.strictEqual('jpeg', metadata.format);
      assert.strictEqual(2725, metadata.width);
      assert.strictEqual(2225, metadata.height);
      assert.strictEqual('srgb', metadata.space);
      assert.strictEqual(3, metadata.channels);
      assert.strictEqual('undefined', typeof metadata.orientation);
      done();
    });
  },
  // Metadata - JPEG with EXIF
  function(done) {
    sharp(inputJpgWithExif).metadata(function(err, metadata) {
      if (err) throw err;
      assert.strictEqual('jpeg', metadata.format);
      assert.strictEqual(450, metadata.width);
      assert.strictEqual(600, metadata.height);
      assert.strictEqual('srgb', metadata.space);
      assert.strictEqual(3, metadata.channels);
      assert.strictEqual(false, metadata.hasAlpha);
      assert.strictEqual(8, metadata.orientation);
      done();
    });
  },
  // Metadata - TIFF
  function(done) {
    sharp(inputTiff).metadata(function(err, metadata) {
      if (err) throw err;
      assert.strictEqual('tiff', metadata.format);
      assert.strictEqual(2464, metadata.width);
      assert.strictEqual(3248, metadata.height);
      assert.strictEqual('b-w', metadata.space);
      assert.strictEqual(1, metadata.channels);
      assert.strictEqual(false, metadata.hasAlpha);
      done();
    });
  },
  // Metadata - PNG
  function(done) {
    sharp(inputPng).metadata(function(err, metadata) {
      if (err) throw err;
      assert.strictEqual('png', metadata.format);
      assert.strictEqual(2809, metadata.width);
      assert.strictEqual(2074, metadata.height);
      assert.strictEqual('b-w', metadata.space);
      assert.strictEqual(1, metadata.channels);
      assert.strictEqual(false, metadata.hasAlpha);
      done();
    });
  },
  // Metadata - Transparent PNG
  function(done) {
    sharp(inputPngWithTransparency).metadata(function(err, metadata) {
      if (err) throw err;
      assert.strictEqual('png', metadata.format);
      assert.strictEqual(2048, metadata.width);
      assert.strictEqual(1536, metadata.height);
      assert.strictEqual('srgb', metadata.space);
      assert.strictEqual(4, metadata.channels);
      assert.strictEqual(true, metadata.hasAlpha);
      done();
    });
  },
  // Metadata - WebP
  function(done) {
    sharp(inputWebP).metadata(function(err, metadata) {
      if (err) throw err;
      assert.strictEqual('webp', metadata.format);
      assert.strictEqual(1024, metadata.width);
      assert.strictEqual(772, metadata.height);
      assert.strictEqual('srgb', metadata.space);
      assert.strictEqual(3, metadata.channels);
      assert.strictEqual(false, metadata.hasAlpha);
      done();
    });
  },
  // Metadata - GIF (via libmagick)
  function(done) {
    sharp(inputGif).metadata(function(err, metadata) {
      if (err) throw err;
      assert.strictEqual('magick', metadata.format);
      assert.strictEqual(800, metadata.width);
      assert.strictEqual(533, metadata.height);
      assert.strictEqual(3, metadata.channels);
      assert.strictEqual(false, metadata.hasAlpha);
      done();
    });
  },
  // Metadata - Promise
  function(done) {
    sharp(inputJpg).metadata().then(function(metadata) {
      assert.strictEqual('jpeg', metadata.format);
      assert.strictEqual(2725, metadata.width);
      assert.strictEqual(2225, metadata.height);
      assert.strictEqual('srgb', metadata.space);
      assert.strictEqual(3, metadata.channels);
      assert.strictEqual(false, metadata.hasAlpha);
      done();
    });
  },
  // Metadata - Stream
  function(done) {
    var readable = fs.createReadStream(inputJpg);
    var pipeline = sharp().metadata(function(err, metadata) {
      if (err) throw err;
      assert.strictEqual('jpeg', metadata.format);
      assert.strictEqual(2725, metadata.width);
      assert.strictEqual(2225, metadata.height);
      assert.strictEqual('srgb', metadata.space);
      assert.strictEqual(3, metadata.channels);
      assert.strictEqual(false, metadata.hasAlpha);
      done();
    });
    readable.pipe(pipeline);
  },
  // Get metadata then resize to half width
  function(done) {
    var image = sharp(inputJpg);
    image.metadata(function(err, metadata) {
      if (err) throw err;
      assert.strictEqual('jpeg', metadata.format);
      assert.strictEqual(2725, metadata.width);
      assert.strictEqual(2225, metadata.height);
      assert.strictEqual('srgb', metadata.space);
      assert.strictEqual(3, metadata.channels);
      assert.strictEqual(false, metadata.hasAlpha);
      image.resize(metadata.width / 2).toBuffer(function(err, data, info) {
        if (err) throw err;
        assert.strictEqual(true, data.length > 0);
        assert.strictEqual(1362, info.width);
        assert.strictEqual(1112, info.height);
        done();
      });
    });
  },
  // Gamma correction
  function(done) {
    sharp(inputJpgWithGammaHoliness).resize(129, 111).toFile(path.join(fixturesPath, 'output.gamma-0.0.jpg'), function(err) {
      if (err) throw err;
      done();
    });
  },
  function(done) {
    sharp(inputJpgWithGammaHoliness).resize(129, 111).gamma().toFile(path.join(fixturesPath, 'output.gamma-2.2.jpg'), function(err) {
      if (err) throw err;
      done();
    });
  },
  function(done) {
    sharp(inputJpgWithGammaHoliness).resize(129, 111).gamma(3).toFile(path.join(fixturesPath, 'output.gamma-3.0.jpg'), function(err) {
      if (err) throw err;
      done();
    });
  },
  // Greyscale conversion
  function(done) {
    sharp(inputJpg).resize(320, 240).greyscale().toFile(path.join(fixturesPath, 'output.greyscale-gamma-0.0.jpg'), function(err) {
      if (err) throw err;
      done();
    });
  },
  function(done) {
    sharp(inputJpg).resize(320, 240).gamma().greyscale().toFile(path.join(fixturesPath, 'output.greyscale-gamma-2.2.jpg'), function(err) {
      if (err) throw err;
      done();
    });
  },
  // Flattening
  function(done) {
    sharp(inputPngWithTransparency).flatten().resize(400, 300).toFile(path.join(fixturesPath, 'output.flatten-black.jpg'), function(err) {
      if (err) throw err;
      done();
    });
  },
  function(done) {
    sharp(inputPngWithTransparency).flatten().background({r: 255, g: 102, b: 0}).resize(400, 300).toFile(path.join(fixturesPath, 'output.flatten-rgb-orange.jpg'), function(err) {
      if (err) throw err;
      done();
    });
  },
  function(done) {
    sharp(inputPngWithTransparency).flatten().background('#ff6600').resize(400, 300).toFile(path.join(fixturesPath, 'output.flatten-hex-orange.jpg'), function(err) {
      if (err) throw err;
      done();
    });
  },
  function(done) {
    sharp(inputJpg).background('#ff0000').flatten().resize(500, 400).toFile(path.join(fixturesPath, 'output.flatten-input-jpg.jpg'), function(err) {
      if (err) throw err;
      done();
    });
  },
  // Verify internal counters
  function(done) {
    var counters = sharp.counters();
    assert.strictEqual(0, counters.queue);
    assert.strictEqual(0, counters.process);
    done();
  },
  // Empty cache
  function(done) {
    sharp.cache(0);
    done();
  }
]);
