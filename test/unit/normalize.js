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
      })
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

  it('should extract handle luminance range', function (done) {
    sharp(fixtures.inputJpgWithLowContrast)
      .normalise( 10, 70)
      .raw()
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assertNormalized(data);
        done();
      });
  });

  it('should throw error when the lowerBin is below zero', function () {
    assert.throws(
      () => sharp().normalise(-10),
      /Range must be between 0 and 100 inclusively/
    );
  });

  it('should throw error when the lowerBin is above 100', function () {
    assert.throws(
      () => sharp().normalise(110),
      /Range must be between 0 and 100 inclusively/
    );
  });

  it('should throw error when the upperBin is below zero', function () {
    assert.throws(
      () => sharp().normalise(0,-10),
      /Range must be between 0 and 100 inclusively/
    );
  });

  it('should throw error when the upperBin is above 100', function () {
    assert.throws(
      () => sharp().normalise(0,110),
      /Range must be between 0 and 100 inclusively/
    );
  });

  it('should throw error when the lowerBin is not type number', function () {
    assert.throws(
      () => sharp().normalise(''),
      /lowerBin and upperBin must be of type number/
    );
  });

  it('should throw error when the upperBin is not type number', function () {
    assert.throws(
      () => sharp().normalise(0,''),
      /lowerBin and upperBin must be of type number/
    );
  });
});
