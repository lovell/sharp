'use strict';

var path = require('path');
var assert = require('assert');
var sharp = require('../../index');


// Constants
var MAX_ALLOWED_MEAN_SQUARED_ERROR = 0.0005;

// Helpers
var getPath = function(filename) {
  return path.join(__dirname, filename);
};

// Generates a 64-bit-as-binary-string image fingerprint
// Based on the dHash gradient method - see http://www.hackerfactor.com/blog/index.php?/archives/529-Kind-of-Like-That.html
var fingerprint = function(image, callback) {
  sharp(image)
    .greyscale()
    .normalise()
    .resize(9, 8)
    .ignoreAspectRatio()
    .interpolateWith(sharp.interpolator.vertexSplitQuadraticBasisSpline)
    .raw()
    .toBuffer(function(err, data) {
      if (err) {
        callback(err);
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
        callback(null, fingerprint);
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
  inputPngOverlayLayer0: getPath('alpha-layer-0-background.png'),
  inputPngOverlayLayer1: getPath('alpha-layer-1-fill.png'),
  inputPngOverlayLayer2: getPath('alpha-layer-2-ink.png'),
  inputPngOverlayLayer1LowAlpha: getPath('alpha-layer-1-fill-low-alpha.png'),
  inputPngOverlayLayer2LowAlpha: getPath('alpha-layer-2-ink-low-alpha.png'),
  inputPngAlphaPremultiplicationSmall: getPath('alpha-premultiply-1024x768-paper.png'),
  inputPngAlphaPremultiplicationLarge: getPath('alpha-premultiply-2048x1536-paper.png'),

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
  // Specify distance threshold using `options={threshold: 42}`, default
  // `threshold` is 5;
  assertSimilar: function(expectedImage, actualImage, options, callback) {
    if (typeof options === 'function') {
      callback = options;
      options = {};
    }

    if (typeof options === 'undefined' && options === null) {
      options = {};
    }

    if (options.threshold === null || typeof options.threshold === 'undefined') {
      options.threshold = 5; // ~7% threshold
    }

    if (typeof options.threshold !== 'number') {
      throw new TypeError('`options.threshold` must be a number');
    }

    if (typeof callback !== 'function') {
      throw new TypeError('`callback` must be a function');
    }

    fingerprint(expectedImage, function(err, expectedFingerprint) {
      if (err) return callback(err);
      fingerprint(actualImage, function(err, actualFingerprint) {
        if (err) return callback(err);
        var distance = 0;
        for (var i = 0; i < 64; i++) {
          if (expectedFingerprint[i] !== actualFingerprint[i]) {
            distance++;
          }
        }

        if (distance > options.threshold) {
          return callback(new Error('Expected maximum similarity distance: ' + options.threshold + '. Actual: ' + distance + '.'));
        }

        callback();
      });
    });
  },

  assertEqual: function(actualImagePath, expectedImagePath, callback) {
    if (typeof actualImagePath !== 'string') {
      throw new TypeError('`actualImagePath` must be a string; got ' + actualImagePath);
    }

    if (typeof expectedImagePath !== 'string') {
      throw new TypeError('`expectedImagePath` must be a string; got ' + expectedImagePath);
    }

    if (typeof callback !== 'function') {
      throw new TypeError('`callback` must be a function');
    }

    sharp.compare(actualImagePath, expectedImagePath, function (error, info) {
      if (error) return callback(error);

      var meanSquaredError = info.meanSquaredError;
      if (typeof meanSquaredError !== 'undefined' && meanSquaredError > MAX_ALLOWED_MEAN_SQUARED_ERROR) {
        return callback(new Error('Expected images be equal. Mean squared error: ' + meanSquaredError + '.'));
      }

      return callback(null, info);
    });
  }

};
