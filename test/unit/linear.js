'use strict';

const sharp = require('../../');
const fixtures = require('../fixtures');

const assert = require('assert');

describe('Linear adjustment', function () {
  const blackPoint = 70;
  const whitePoint = 203;
  const a = 255 / (whitePoint - blackPoint);
  const b = -blackPoint * a;

  it('applies linear levels adjustment w/o alpha ch', function (done) {
    sharp(fixtures.inputJpgWithLowContrast)
      .linear(a, b)
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        fixtures.assertSimilar(fixtures.expected('low-contrast-linear.jpg'), data, done);
      });
  });

  it('applies slope level adjustment w/o alpha ch', function (done) {
    sharp(fixtures.inputJpgWithLowContrast)
      .linear(a)
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        fixtures.assertSimilar(fixtures.expected('low-contrast-slope.jpg'), data, done);
      });
  });

  it('applies offset level adjustment w/o alpha ch', function (done) {
    sharp(fixtures.inputJpgWithLowContrast)
      .linear(null, b)
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        fixtures.assertSimilar(fixtures.expected('low-contrast-offset.jpg'), data, done);
      });
  });

  it('applies linear levels adjustment w alpha ch', function (done) {
    sharp(fixtures.inputPngOverlayLayer1)
      .linear(a, b)
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        fixtures.assertSimilar(fixtures.expected('alpha-layer-1-fill-linear.png'), data, done);
      });
  });

  it('applies slope level adjustment w alpha ch', function (done) {
    sharp(fixtures.inputPngOverlayLayer1)
      .linear(a)
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        fixtures.assertSimilar(fixtures.expected('alpha-layer-1-fill-slope.png'), data, done);
      });
  });

  it('applies offset level adjustment w alpha ch', function (done) {
    sharp(fixtures.inputPngOverlayLayer1)
      .linear(null, b)
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        fixtures.assertSimilar(fixtures.expected('alpha-layer-1-fill-offset.png'), data, done);
      });
  });

  it('per channel level adjustment', function (done) {
    sharp(fixtures.inputWebP)
      .linear([0.25, 0.5, 0.75], [150, 100, 50]).toBuffer(function (err, data, info) {
        if (err) throw err;
        fixtures.assertSimilar(fixtures.expected('linear-per-channel.jpg'), data, done);
      });
  });

  it('Invalid linear arguments', function () {
    assert.throws(
      () => sharp().linear('foo'),
      /Expected number or array of numbers for a but received foo of type string/
    );
    assert.throws(
      () => sharp().linear(undefined, { bar: 'baz' }),
      /Expected number or array of numbers for b but received \[object Object\] of type object/
    );
    assert.throws(
      () => sharp().linear([], [1]),
      /Expected number or array of numbers for a but received {2}of type object/
    );
    assert.throws(
      () => sharp().linear([1, 2], [1]),
      /Expected a and b to be arrays of the same length/
    );
    assert.throws(
      () => sharp().linear([1]),
      /Expected a and b to be arrays of the same length/
    );
  });
});
