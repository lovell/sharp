'use strict';

const assert = require('assert');

const sharp = require('../../');
const inRange = require('../../lib/is').inRange;
const fixtures = require('../fixtures');

describe('Trim borders', function () {
  it('Threshold default', function (done) {
    const expected = fixtures.expected('alpha-layer-1-fill-trim-resize.png');
    sharp(fixtures.inputPngOverlayLayer1)
      .resize(450, 322)
      .trim()
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

  it('single colour PNG where alpha channel provides the image', () =>
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

  it('should rotate before trim', () =>
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

  describe('Invalid thresholds', function () {
    [-1, 'fail', {}].forEach(function (threshold) {
      it(JSON.stringify(threshold), function () {
        assert.throws(function () {
          sharp().trim(threshold);
        });
      });
    });
  });
});
