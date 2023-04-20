// Copyright 2013 Lovell Fuller and others.
// SPDX-License-Identifier: Apache-2.0

'use strict';

const assert = require('assert');

const sharp = require('../../');
const inRange = require('../../lib/is').inRange;
const fixtures = require('../fixtures');

describe('Trim borders', function () {
  it('Skip shrink-on-load', function (done) {
    const expected = fixtures.expected('alpha-layer-2-trim-resize.jpg');
    sharp(fixtures.inputJpgOverlayLayer2)
      .trim()
      .resize({
        width: 300,
        fastShrinkOnLoad: false
      })
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual('jpeg', info.format);
        assert.strictEqual(300, info.width);
        assert.strictEqual(true, inRange(info.trimOffsetLeft, -873, -870));
        assert.strictEqual(-554, info.trimOffsetTop);
        fixtures.assertSimilar(expected, data, done);
      });
  });

  it('Single colour PNG where alpha channel provides the image', () =>
    sharp(fixtures.inputPngImageInAlpha)
      .trim()
      .toBuffer({ resolveWithObject: true })
      .then(({ data, info }) => {
        assert.strictEqual(true, data.length > 0);
        assert.strictEqual('png', info.format);
        assert.strictEqual(916, info.width);
        assert.strictEqual(137, info.height);
        assert.strictEqual(4, info.channels);
        assert.strictEqual(-6, info.trimOffsetLeft);
        assert.strictEqual(-20, info.trimOffsetTop);
      })
  );

  it('16-bit PNG with alpha channel', function (done) {
    sharp(fixtures.inputPngWithTransparency16bit)
      .resize(32, 32)
      .trim(20)
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual(true, data.length > 0);
        assert.strictEqual('png', info.format);
        assert.strictEqual(32, info.width);
        assert.strictEqual(32, info.height);
        assert.strictEqual(4, info.channels);
        assert.strictEqual(-2, info.trimOffsetLeft);
        assert.strictEqual(-2, info.trimOffsetTop);
        fixtures.assertSimilar(fixtures.expected('trim-16bit-rgba.png'), data, done);
      });
  });

  it('Attempt to trim 2x2 pixel image fails', function (done) {
    sharp({
      create: {
        width: 2,
        height: 2,
        channels: 3,
        background: 'red'
      }
    })
      .trim()
      .toBuffer()
      .then(() => {
        done(new Error('Expected an error'));
      })
      .catch(err => {
        assert.strictEqual('Image to trim must be at least 3x3 pixels', err.message);
        done();
      })
      .catch(done);
  });

  it('Should rotate before trim', () =>
    sharp({
      create: {
        width: 20,
        height: 30,
        channels: 3,
        background: 'white'
      }
    })
      .rotate(30)
      .png()
      .toBuffer()
      .then(rotated30 =>
        sharp(rotated30)
          .rotate(-30)
          .trim(128)
          .toBuffer({ resolveWithObject: true })
          .then(({ info }) => {
            assert.strictEqual(20, info.width);
            assert.strictEqual(31, info.height);
            assert.strictEqual(-8, info.trimOffsetTop);
            assert.strictEqual(-13, info.trimOffsetLeft);
          })
      )
  );

  it('Animated image rejects', () =>
    assert.rejects(() => sharp(fixtures.inputGifAnimated, { animated: true })
      .trim()
      .toBuffer(),
    /Trim is not supported for multi-page images/
    )
  );

  it('Ensure trim uses bounding box of alpha and non-alpha channels', async () => {
    const { info } = await sharp(fixtures.inputPngTrimIncludeAlpha)
      .trim()
      .toBuffer({ resolveWithObject: true });

    const { width, height, trimOffsetTop, trimOffsetLeft } = info;
    assert.strictEqual(width, 179);
    assert.strictEqual(height, 123);
    assert.strictEqual(trimOffsetTop, -44);
    assert.strictEqual(trimOffsetLeft, -13);
  });

  it('Ensure greyscale image can be trimmed', async () => {
    const greyscale = await sharp({
      create: {
        width: 16,
        height: 8,
        channels: 3,
        background: 'silver'
      }
    })
      .extend({ left: 12, right: 24, background: 'gray' })
      .toColourspace('b-w')
      .png({ compressionLevel: 0 })
      .toBuffer();

    const { info } = await sharp(greyscale)
      .trim()
      .raw()
      .toBuffer({ resolveWithObject: true });

    const { width, height, trimOffsetTop, trimOffsetLeft } = info;
    assert.strictEqual(width, 16);
    assert.strictEqual(height, 8);
    assert.strictEqual(trimOffsetTop, 0);
    assert.strictEqual(trimOffsetLeft, -12);
  });

  it('Ensure CMYK image can be trimmed', async () => {
    const cmyk = await sharp({
      create: {
        width: 16,
        height: 8,
        channels: 3,
        background: 'red'
      }
    })
      .extend({ left: 12, right: 24, background: 'blue' })
      .toColourspace('cmyk')
      .jpeg()
      .toBuffer();

    const { info } = await sharp(cmyk)
      .trim()
      .raw()
      .toBuffer({ resolveWithObject: true });

    const { width, height, trimOffsetTop, trimOffsetLeft } = info;
    assert.strictEqual(width, 16);
    assert.strictEqual(height, 8);
    assert.strictEqual(trimOffsetTop, 0);
    assert.strictEqual(trimOffsetLeft, -12);
  });

  it('Ensure trim of image with all pixels same is no-op', async () => {
    const { info } = await sharp({
      create: {
        width: 5,
        height: 5,
        channels: 3,
        background: 'red'
      }
    })
      .trim()
      .toBuffer({ resolveWithObject: true });

    const { width, height, trimOffsetTop, trimOffsetLeft } = info;
    assert.strictEqual(width, 5);
    assert.strictEqual(height, 5);
    assert.strictEqual(trimOffsetTop, 0);
    assert.strictEqual(trimOffsetLeft, 0);
  });

  describe('Valid parameters', function () {
    const expected = fixtures.expected('alpha-layer-1-fill-trim-resize.png');
    Object.entries({
      'Background and threshold default': undefined,
      'Background string': '#00000000',
      'Background option': {
        background: '#00000000'
      },
      'Threshold number': 10,
      'Threshold option': {
        threshold: 10
      }
    }).forEach(function ([description, parameter]) {
      it(description, function (done) {
        sharp(fixtures.inputPngOverlayLayer1)
          .resize(450, 322)
          .trim(parameter)
          .toBuffer(function (err, data, info) {
            if (err) throw err;
            assert.strictEqual('png', info.format);
            assert.strictEqual(450, info.width);
            assert.strictEqual(322, info.height);
            assert.strictEqual(-204, info.trimOffsetLeft);
            assert.strictEqual(0, info.trimOffsetTop);
            fixtures.assertSimilar(expected, data, done);
          });
      });
    });
  });

  describe('Invalid parameters', function () {
    Object.entries({
      'Invalid background string': 'fail',
      'Invalid background option': {
        background: 'fail'
      },

      'Negative threshold number': -1,
      'Negative threshold option': {
        threshold: -1
      },

      Boolean: false
    }).forEach(function ([description, parameter]) {
      it(description, function () {
        assert.throws(function () {
          sharp().trim(parameter);
        });
      });
    });
  });

  describe('Specific background colour', function () {
    it('Doesn\'t trim at all', async () => {
      const { info } = await sharp(fixtures.inputPngTrimSpecificColour)
        .trim('yellow')
        .toBuffer({ resolveWithObject: true });

      const { width, height, trimOffsetTop, trimOffsetLeft } = info;
      assert.strictEqual(width, 900);
      assert.strictEqual(height, 600);
      assert.strictEqual(trimOffsetTop, 0);
      assert.strictEqual(trimOffsetLeft, 0);
    });

    it('Only trims the bottom', async () => {
      const { info } = await sharp(fixtures.inputPngTrimSpecificColour)
        .trim('#21468B')
        .toBuffer({ resolveWithObject: true });

      const { width, height, trimOffsetTop, trimOffsetLeft } = info;
      assert.strictEqual(width, 900);
      assert.strictEqual(height, 401);
      assert.strictEqual(trimOffsetTop, 0);
      assert.strictEqual(trimOffsetLeft, 0);
    });

    it('Only trims the bottom, in 16-bit', async () => {
      const { info } = await sharp(fixtures.inputPngTrimSpecificColour16bit)
        .trim('#21468B')
        .toBuffer({ resolveWithObject: true });

      const { width, height, trimOffsetTop, trimOffsetLeft } = info;
      assert.strictEqual(width, 900);
      assert.strictEqual(height, 401);
      assert.strictEqual(trimOffsetTop, 0);
      assert.strictEqual(trimOffsetLeft, 0);
    });

    it('Only trims the bottom, including alpha', async () => {
      const { info } = await sharp(fixtures.inputPngTrimSpecificColourIncludeAlpha)
        .trim('#21468B80')
        .toBuffer({ resolveWithObject: true });

      const { width, height, trimOffsetTop, trimOffsetLeft } = info;
      assert.strictEqual(width, 900);
      assert.strictEqual(height, 401);
      assert.strictEqual(trimOffsetTop, 0);
      assert.strictEqual(trimOffsetLeft, 0);
    });
  });
});
