'use strict';

const assert = require('assert');
const sharp = require('../../lib');
const fixtures = require('../fixtures');

describe('Match template operation', function () {
  it('Ref image appears in image', function (done) {
    sharp(fixtures.inputJpgWithLandscapeExif1)
      .matchTemplate(fixtures.inputJpgFlowerCroppedFromLandscape1).then((results) => {
        assert.strictEqual(61597, results.min);
        assert.strictEqual(209, results.minX);
        assert.strictEqual(321, results.minY);
        assert.strictEqual(84815952, results.referenceSumSquares);
        assert.strictEqual(0.999273756898938, results.score);
        done();
      });
  })

  it('Ref image does not appear in image', function (done) {
    sharp(fixtures.inputJpg320x240)
      .matchTemplate(fixtures.inputJpgFlowerCroppedFromLandscape1).then((results) => {
        assert.strictEqual(14667082, results.min);
        assert.strictEqual(0, results.minX);
        assert.strictEqual(239, results.minY);
        assert.strictEqual(84815952, results.referenceSumSquares);
        assert.strictEqual(0.8270716574636809, results.score);
        done();
      });
  })

  it('Missing input throws', function () {
    assert.throws(function () {
      sharp().matchTemplate();
    });
  });
});
