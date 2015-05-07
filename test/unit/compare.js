'use strict';

var assert = require('assert');
var fixtures = require('../fixtures');
var fs = require('fs');
var sharp = require('../../index');

sharp.cache(0);


// Constants
var MAX_ALLOWED_MEAN_SQUARED_ERROR = 0.0005;

// Tests
describe('sharp.compare', function() {
  it('should report equality when comparing an image to itself', function(done) {
    var image = fixtures.inputPngOverlayLayer0;

    sharp.compare(image, image, function (error, info) {
      if (error) return done(error);

      assert.strictEqual(info.isEqual, true, 'image is equal to itself');
      assert.strictEqual(info.status, 'success', 'status is correct');
      assert(0 <= info.meanSquaredError &&
        info.meanSquaredError <= MAX_ALLOWED_MEAN_SQUARED_ERROR,
        'MSE is within tolerance');
      done();
    });
  });

  it('should report that two images have a mismatched number of bands (channels)', function(done) {
    var actual = fixtures.inputPngOverlayLayer1;
    var expected = fixtures.inputJpg;

    sharp.compare(actual, expected, function (error, info) {
      if (error) return done(error);

      assert.strictEqual(info.isEqual, false);
      assert.strictEqual(info.status, 'mismatchedBands');
      assert(typeof info.meanSquaredError === 'undefined', 'MSE is undefined');
      done();
    });
  });

  it('should report that two images have a mismatched dimensions', function(done) {
    var actual = fixtures.inputJpg;
    var expected = fixtures.inputJpgWithExif;

    sharp.compare(actual, expected, function (error, info) {
      if (error) return done(error);

      assert.strictEqual(info.isEqual, false);
      assert.strictEqual(info.status, 'mismatchedDimensions');
      assert(typeof info.meanSquaredError === 'undefined', 'MSE is undefined');
      done();
    });
  });

  it('should report the correct mean squared error for two different images', function(done) {
    var actual = fixtures.inputPngOverlayLayer0;
    var expected = fixtures.inputPngOverlayLayer1;

    sharp.compare(actual, expected, function (error, info) {
      if (error) return done(error);

      var meanSquaredError = info.meanSquaredError;
      assert.strictEqual(info.isEqual, false);
      assert.strictEqual(info.status, 'success');
      // ImageMagick reports: 42242.5
      // `compare -metric mse 'actual' 'expected' comparison.png`
      assert(41900 <= meanSquaredError && meanSquaredError <= 41950,
        'Expected: 41900 <= meanSquaredError <= 41950. Actual: ' + meanSquaredError);
      done();
    });
  });

});
