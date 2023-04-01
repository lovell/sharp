// Copyright 2013 Lovell Fuller and others.
// SPDX-License-Identifier: Apache-2.0

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
      .resize(240)
      .linear(a, b)
      .toBuffer(function (err, data) {
        if (err) throw err;
        fixtures.assertSimilar(fixtures.expected('alpha-layer-1-fill-linear.png'), data, done);
      });
  });

  it('applies linear levels adjustment to 16-bit w alpha ch', function (done) {
    sharp(fixtures.inputPngWithTransparency16bit)
      .linear(a, b)
      .png({ compressionLevel: 0 })
      .toBuffer(function (err, data) {
        if (err) throw err;
        fixtures.assertSimilar(fixtures.expected('linear-16bit.png'), data, done);
      });
  });

  it('applies slope level adjustment w alpha ch', function (done) {
    sharp(fixtures.inputPngOverlayLayer1)
      .resize(240)
      .linear(a)
      .toBuffer(function (err, data) {
        if (err) throw err;
        fixtures.assertSimilar(fixtures.expected('alpha-layer-1-fill-slope.png'), data, done);
      });
  });

  it('applies offset level adjustment w alpha ch', function (done) {
    sharp(fixtures.inputPngOverlayLayer1)
      .resize(240)
      .linear(null, b)
      .toBuffer(function (err, data) {
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

  it('output is integer, not float, RGB', async () => {
    const data = await sharp({ create: { width: 1, height: 1, channels: 3, background: 'red' } })
      .linear(1, 0)
      .tiff({ compression: 'none' })
      .toBuffer();

    const { channels, depth } = await sharp(data).metadata();
    assert.strictEqual(channels, 3);
    assert.strictEqual(depth, 'uchar');
  });

  it('output is integer, not float, RGBA', async () => {
    const data = await sharp({ create: { width: 1, height: 1, channels: 4, background: '#ff000077' } })
      .linear(1, 0)
      .tiff({ compression: 'none' })
      .toBuffer();

    const { channels, depth } = await sharp(data).metadata();
    assert.strictEqual(channels, 4);
    assert.strictEqual(depth, 'uchar');
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
