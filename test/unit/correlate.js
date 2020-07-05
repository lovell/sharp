'use strict';

const assert = require('assert');

const fixtures = require('../fixtures');
const sharp = require('../../');

describe('Correlate operation between two images', function () {
  it('spcor correlation', function (done) {
    sharp(fixtures.inputJpgWithLandscapeExif1)
      .correlate(fixtures.inputJpgFlowerCroppedFromLandscape1)
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual(450, info.height);
        fixtures.assertSimilar(fixtures.expected('landscape_1_flower_correlation.jpg'), data, done);
      });
  });

  it('fastcor correlation', function (done) {
    sharp(fixtures.inputJpgWithLandscapeExif1)
      .correlate(fixtures.inputJpgFlowerCroppedFromLandscape1, { fast: true })
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual(450, info.height);
        fixtures.assertSimilar(fixtures.expected('landscape_1_flower_correlation.jpg'), data, done);
      });
  });

  it('fast is not boolean throws', function () {
    assert.throws(function () {
      sharp().correlate(fixtures.inputJpgFlowerCroppedFromLandscape1, { fast: 123 });
    });
  });

  it('Missing input throws', function () {
    assert.throws(function () {
      sharp().correlate();
    });
  });
});
