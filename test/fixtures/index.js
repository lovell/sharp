'use strict';

var path = require('path');
var assert = require('assert');

var sharp = require('../../index');

var getPath = function(filename) {
  return path.join(__dirname, filename);
};

// Generates a 64-bit-as-binary-string image fingerprint
// Based on the dHash gradient method - see http://www.hackerfactor.com/blog/index.php?/archives/529-Kind-of-Like-That.html
var fingerprint = function(image, done) {
  sharp(image)
    .greyscale()
    .normalise()
    .resize(9, 8)
    .ignoreAspectRatio()
    .interpolateWith(sharp.interpolator.vertexSplitQuadraticBasisSpline)
    .raw()
    .toBuffer(function(err, data) {
      if (err) {
        done(err);
      } else {
        var fingerprint = '';
        for (var col = 0; col < 8; col++) {
          var gradient = 0;
          for (var row = 0; row < 8; row++) {
            var left = data[row * 8 + col];
            var right = data[row * 8 + col + 1];
            fingerprint = fingerprint + (left < right ? '1' : '0');
          }
        }
        done(null, fingerprint);
      }
    });
};

module.exports = {

  inputJpg: getPath('2569067123_aca715a2ee_o.jpg'), // http://www.flickr.com/photos/grizdave/2569067123/
  inputJpgWithExif: getPath('Landscape_8.jpg'), // https://github.com/recurser/exif-orientation-examples/blob/master/Landscape_8.jpg
  inputJpgWithExifMirroring: getPath('Landscape_5.jpg'), // https://github.com/recurser/exif-orientation-examples/blob/master/Landscape_5.jpg
  inputJpgWithGammaHoliness: getPath('gamma_dalai_lama_gray.jpg'), // http://www.4p8.com/eric.brasseur/gamma.html
  inputJpgWithCmykProfile: getPath('Channel_digital_image_CMYK_color.jpg'), // http://en.wikipedia.org/wiki/File:Channel_digital_image_CMYK_color.jpg
  inputJpgWithCmykNoProfile: getPath('Channel_digital_image_CMYK_color_no_profile.jpg'),
  inputJpgWithCorruptHeader: getPath('corrupt-header.jpg'),
  inputJpgWithLowContrast: getPath('low-contrast.jpg'), // http://www.flickr.com/photos/grizdave/2569067123/

  inputPng: getPath('50020484-00001.png'), // http://c.searspartsdirect.com/lis_png/PLDM/50020484-00001.png
  inputPngWithTransparency: getPath('blackbug.png'), // public domain
  inputPngWithGreyAlpha: getPath('grey-8bit-alpha.png'),
  inputPngWithOneColor: getPath('2x2_fdcce6.png'),

  inputWebP: getPath('4.webp'), // http://www.gstatic.com/webp/gallery/4.webp
  inputTiff: getPath('G31D.TIF'), // http://www.fileformat.info/format/tiff/sample/e6c9a6e5253348f4aef6d17b534360ab/index.htm
  inputGif: getPath('Crash_test.gif'), // http://upload.wikimedia.org/wikipedia/commons/e/e3/Crash_test.gif
  inputSvg: getPath('Wikimedia-logo.svg'), // http://commons.wikimedia.org/wiki/File:Wikimedia-logo.svg
  inputPsd: getPath('free-gearhead-pack.psd'), // https://dribbble.com/shots/1624241-Free-Gearhead-Vector-Pack

  inputSvs: getPath('CMU-1-Small-Region.svs'), // http://openslide.cs.cmu.edu/download/openslide-testdata/Aperio/CMU-1-Small-Region.svs

  outputJpg: getPath('output.jpg'),
  outputPng: getPath('output.png'),
  outputWebP: getPath('output.webp'),
  outputZoinks: getPath('output.zoinks'), // an 'unknown' file extension

  // Path for tests requiring human inspection
  path: getPath,

  // Path for expected output images
  expected: function(filename) {
    return getPath(path.join('expected', filename));
  },

  // Verify similarity of expected vs actual images via fingerprint
  assertSimilar: function(expectedImage, actualImage, done) {
    fingerprint(expectedImage, function(err, expectedFingerprint) {
      if (err) throw err;
      fingerprint(actualImage, function(err, actualFingerprint) {
        if (err) throw err;
        var distance = 0;
        for (var i = 0; i < 64; i++) {
          if (expectedFingerprint[i] !== actualFingerprint[i]) {
            distance++;
          }
        }
        assert.strictEqual(true, distance <= 5);  // ~7% threshold
        done();
      });
    });
  }

};
