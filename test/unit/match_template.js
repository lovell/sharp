'use strict';

const assert = require('assert');
const sharp = require('../../lib');
const fixtures = require('../fixtures');

describe('Match Template', function () {
  it('Template image appears in image', function (done) {
    sharp(fixtures.inputJpgWithLandscapeExif1)
      .matchTemplate(fixtures.inputJpgFlowerCroppedFromLandscape1).then((results) => {
        assert.strictEqual(61597, results.min);
        assert.strictEqual(209, results.minX);
        assert.strictEqual(321, results.minY);
        assert.strictEqual(28271984, results.referenceSumSquares);
        assert.strictEqual(0.9959734250784057, results.score);
        done();
      });
  });

  it('Template image does not appear in image', function (done) {
    sharp(fixtures.inputJpg320x240)
      .matchTemplate(fixtures.inputJpgFlowerCroppedFromLandscape1).then((results) => {
        assert.strictEqual(14667082, results.min);
        assert.strictEqual(0, results.minX);
        assert.strictEqual(239, results.minY);
        assert.strictEqual(28271984, results.referenceSumSquares);
        assert.strictEqual(0.6360911144067776, results.score);
        done();
      });
  });

  it('Template image is original image should be perfect match', function (done) {
    sharp(fixtures.inputJpgFlowerCroppedFromLandscape1)
      .matchTemplate(fixtures.inputJpgFlowerCroppedFromLandscape1).then((results) => {
        assert.strictEqual(0, results.min);
        assert.strictEqual(27, results.minX);
        assert.strictEqual(23, results.minY);
        assert.strictEqual(28271984, results.referenceSumSquares);
        assert.strictEqual(1.0, results.score);
        done();
      });
  });

  it('Missing input throws', function () {
    assert.throws(function () {
      sharp().matchTemplate();
    });
  });
});
