// Copyright 2013 Lovell Fuller and others.
// SPDX-License-Identifier: Apache-2.0

'use strict';

const assert = require('assert');

const sharp = require('../../');
const fixtures = require('../fixtures');

const assertNormalized = function (data) {
  let min = 255;
  let max = 0;
  for (let i = 0; i < data.length; i++) {
    min = Math.min(min, data[i]);
    max = Math.max(max, data[i]);
  }
  assert.strictEqual(0, min);
  assert.ok([254, 255].includes(max));
};

describe('Normalization', function () {
  it('spreads rgb image values between 0 and 255', function (done) {
    sharp(fixtures.inputJpgWithLowContrast)
      .normalise()
      .raw()
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assertNormalized(data);
        done();
      });
  });

  it('spreads grayscaled image values between 0 and 255', function (done) {
    sharp(fixtures.inputJpgWithLowContrast)
      .greyscale()
      .normalize()
      .raw()
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assertNormalized(data);
        done();
      });
  });

  it('stretches greyscale images with alpha channel', function (done) {
    sharp(fixtures.inputPngWithGreyAlpha)
      .normalise()
      .raw()
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assertNormalized(data);
        done();
      });
  });

  it('keeps an existing alpha channel', function (done) {
    sharp(fixtures.inputPngWithTransparency)
      .resize(8, 8)
      .normalize()
      .toBuffer(function (err, data) {
        if (err) throw err;
        sharp(data).metadata(function (err, metadata) {
          if (err) return done(err);
          assert.strictEqual(4, metadata.channels);
          assert.strictEqual(true, metadata.hasAlpha);
          assert.strictEqual('srgb', metadata.space);
          done();
        });
      });
  });

  it('keeps the alpha channel of greyscale images intact', function (done) {
    sharp(fixtures.inputPngWithGreyAlpha)
      .resize(8, 8)
      .normalise()
      .toBuffer(function (err, data) {
        if (err) throw err;
        sharp(data).metadata(function (err, metadata) {
          if (err) return done(err);
          assert.strictEqual(true, metadata.hasAlpha);
          assert.strictEqual(4, metadata.channels);
          assert.strictEqual('srgb', metadata.space);
          done();
        });
      });
  });

  it('does not alter images with only one color', function (done) {
    const output = fixtures.path('output.unmodified-png-with-one-color.png');
    sharp(fixtures.inputPngWithOneColor)
      .normalize()
      .toFile(output, function (err, info) {
        if (err) done(err);
        fixtures.assertMaxColourDistance(output, fixtures.inputPngWithOneColor, 0);
        done();
      });
  });

  it('works with 16-bit RGBA images', function (done) {
    sharp(fixtures.inputPngWithTransparency16bit)
      .normalise()
      .raw()
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assertNormalized(data);
        done();
      });
  });

  it('should handle luminance range', function (done) {
    sharp(fixtures.inputJpgWithLowContrast)
      .normalise({ lower: 10, upper: 70 })
      .raw()
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assertNormalized(data);
        done();
      });
  });

  it('should allow lower without upper', function () {
    assert.doesNotThrow(() => sharp().normalize({ lower: 2 }));
  });
  it('should allow upper without lower', function () {
    assert.doesNotThrow(() => sharp().normalize({ upper: 98 }));
  });
  it('should throw when lower is out of range', function () {
    assert.throws(
      () => sharp().normalise({ lower: -10 }),
      /Expected number between 0 and 99 for lower but received -10 of type number/
    );
  });
  it('should throw when upper is out of range', function () {
    assert.throws(
      () => sharp().normalise({ upper: 110 }),
      /Expected number between 1 and 100 for upper but received 110 of type number/
    );
  });
  it('should throw when lower is not a number', function () {
    assert.throws(
      () => sharp().normalise({ lower: 'fail' }),
      /Expected number between 0 and 99 for lower but received fail of type string/
    );
  });
  it('should throw when upper is not a number', function () {
    assert.throws(
      () => sharp().normalise({ upper: 'fail' }),
      /Expected number between 1 and 100 for upper but received fail of type string/
    );
  });
  it('should throw when the lower and upper are equal', function () {
    assert.throws(
      () => sharp().normalise({ lower: 2, upper: 2 }),
      /Expected lower to be less than upper for range but received 2 >= 2/
    );
  });
  it('should throw when the lower is greater than upper', function () {
    assert.throws(
      () => sharp().normalise({ lower: 3, upper: 2 }),
      /Expected lower to be less than upper for range but received 3 >= 2/
    );
  });
});
