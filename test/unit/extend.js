'use strict';

const assert = require('assert');

const sharp = require('../../');
const fixtures = require('../fixtures');

describe('Extend', function () {
  it('extend all sides equally via a single value', function (done) {
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

  it('extend all sides equally with RGB', function (done) {
    sharp(fixtures.inputJpg)
      .resize(120)
      .extend({
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
        fixtures.assertSimilar(fixtures.expected('extend-equal.jpg'), data, done);
      });
  });

  it('extend sides unequally with RGBA', function (done) {
    sharp(fixtures.inputPngWithTransparency16bit)
      .resize(120)
      .extend({
        top: 50,
        left: 10,
        right: 35,
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual(165, info.width);
        assert.strictEqual(170, info.height);
        fixtures.assertSimilar(fixtures.expected('extend-unequal.png'), data, done);
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

  it('PNG with 2 channels', function (done) {
    sharp(fixtures.inputPngWithGreyAlpha)
      .extend({
        bottom: 20,
        right: 20,
        background: 'transparent'
      })
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual(true, data.length > 0);
        assert.strictEqual('png', info.format);
        assert.strictEqual(420, info.width);
        assert.strictEqual(320, info.height);
        assert.strictEqual(4, info.channels);
        fixtures.assertSimilar(fixtures.expected('extend-2channel.png'), data, done);
      });
  });

  it('Premultiply background when compositing', async () => {
    const background = '#bf1942cc';
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
    const [r1, g1, b1, a1, r2, g2, b2, a2] = data;
    assert.strictEqual(true, Math.abs(r2 - r1) < 2);
    assert.strictEqual(true, Math.abs(g2 - g1) < 2);
    assert.strictEqual(true, Math.abs(b2 - b1) < 2);
    assert.strictEqual(true, Math.abs(a2 - a1) < 2);
  });
});
