// Copyright 2013 Lovell Fuller and others.
// SPDX-License-Identifier: Apache-2.0

'use strict';

const assert = require('assert');

const sharp = require('../../');
const fixtures = require('../fixtures');

describe('Extend', function () {
  describe('extend all sides equally via a single value', function () {
    it('JPEG', function (done) {
      sharp(fixtures.inputJpg)
        .resize(120)
        .extend(10)
        .toBuffer(function (err, data, info) {
          if (err) throw err;
          assert.strictEqual(140, info.width);
          assert.strictEqual(118, info.height);
          fixtures.assertSimilar(fixtures.expected('extend-equal-single.jpg'), data, done);
        });
    });

    it('Animated WebP', function (done) {
      sharp(fixtures.inputWebPAnimated, { pages: -1 })
        .resize(120)
        .extend(10)
        .toBuffer(function (err, data, info) {
          if (err) throw err;
          assert.strictEqual(140, info.width);
          assert.strictEqual(140 * 9, info.height);
          fixtures.assertSimilar(fixtures.expected('extend-equal-single.webp'), data, done);
        });
    });
  });

  ['background', 'copy', 'mirror', 'repeat'].forEach(extendWith => {
    it(`extends all sides with animated WebP (${extendWith})`, function (done) {
      sharp(fixtures.inputWebPAnimated, { pages: -1 })
        .resize(120)
        .extend({
          extendWith: extendWith,
          top: 40,
          bottom: 40,
          left: 40,
          right: 40
        })
        .toBuffer(function (err, data, info) {
          if (err) throw err;
          assert.strictEqual(200, info.width);
          assert.strictEqual(200 * 9, info.height);
          fixtures.assertSimilar(fixtures.expected(`extend-equal-${extendWith}.webp`), data, done);
        });
    });

    it(`extend all sides equally with RGB (${extendWith})`, function (done) {
      sharp(fixtures.inputJpg)
        .resize(120)
        .extend({
          extendWith: extendWith,
          top: 10,
          bottom: 10,
          left: 10,
          right: 10,
          background: { r: 255, g: 0, b: 0 }
        })
        .toBuffer(function (err, data, info) {
          if (err) throw err;
          assert.strictEqual(140, info.width);
          assert.strictEqual(118, info.height);
          fixtures.assertSimilar(fixtures.expected(`extend-equal-${extendWith}.jpg`), data, done);
        });
    });

    it(`extend sides unequally with RGBA (${extendWith})`, function (done) {
      sharp(fixtures.inputPngWithTransparency16bit)
        .resize(120)
        .extend({
          extendWith: extendWith,
          top: 50,
          left: 10,
          right: 35,
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .toBuffer(function (err, data, info) {
          if (err) throw err;
          assert.strictEqual(165, info.width);
          assert.strictEqual(170, info.height);
          fixtures.assertSimilar(fixtures.expected(`extend-unequal-${extendWith}.png`), data, done);
        });
    });

    it(`PNG with 2 channels (${extendWith})`, function (done) {
      sharp(fixtures.inputPngWithGreyAlpha)
        .extend({
          extendWith: extendWith,
          top: 50,
          bottom: 50,
          left: 80,
          right: 80,
          background: 'transparent'
        })
        .toBuffer(function (err, data, info) {
          if (err) throw err;
          assert.strictEqual(true, data.length > 0);
          assert.strictEqual('png', info.format);
          assert.strictEqual(560, info.width);
          assert.strictEqual(400, info.height);
          assert.strictEqual(4, info.channels);
          fixtures.assertSimilar(fixtures.expected(`extend-2channel-${extendWith}.png`), data, done);
        });
    });
  });

  it('missing parameter fails', function () {
    assert.throws(function () {
      sharp().extend();
    });
  });
  it('negative fails', function () {
    assert.throws(function () {
      sharp().extend(-1);
    });
  });
  it('invalid top fails', () => {
    assert.throws(
      () => sharp().extend({ top: 'fail' }),
      /Expected positive integer for top but received fail of type string/
    );
  });
  it('invalid bottom fails', () => {
    assert.throws(
      () => sharp().extend({ bottom: -1 }),
      /Expected positive integer for bottom but received -1 of type number/
    );
  });
  it('invalid left fails', () => {
    assert.throws(
      () => sharp().extend({ left: 0.1 }),
      /Expected positive integer for left but received 0.1 of type number/
    );
  });
  it('invalid right fails', () => {
    assert.throws(
      () => sharp().extend({ right: {} }),
      /Expected positive integer for right but received \[object Object\] of type object/
    );
  });
  it('invalid extendWith fails', () => {
    assert.throws(
      () => sharp().extend({ extendWith: 'invalid-value' }),
      /Expected one of: background, copy, repeat, mirror for extendWith but received invalid-value of type string/
    );
  });
  it('can set all edges apart from right', () => {
    assert.doesNotThrow(() => sharp().extend({ top: 1, left: 2, bottom: 3 }));
  });

  it('should add alpha channel before extending with a transparent Background', function (done) {
    sharp(fixtures.inputJpgWithLandscapeExif1)
      .extend({
        bottom: 10,
        right: 10,
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .toFormat(sharp.format.png)
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual(610, info.width);
        assert.strictEqual(460, info.height);
        fixtures.assertSimilar(fixtures.expected('addAlphaChanelBeforeExtend.png'), data, done);
      });
  });

  it('Premultiply background when compositing', async () => {
    const background = { r: 191, g: 25, b: 66, alpha: 0.8 };
    const data = await sharp({
      create: {
        width: 1, height: 1, channels: 4, background: '#fff0'
      }
    })
      .composite([{
        input: {
          create: {
            width: 1, height: 1, channels: 4, background
          }
        }
      }])
      .extend({
        left: 1, background
      })
      .raw()
      .toBuffer();
    assert.deepStrictEqual(Array.from(data), [191, 25, 66, 204, 191, 25, 66, 204]);
  });
});
