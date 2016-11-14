'use strict';

const assert = require('assert');

const sharp = require('../../');
const fixtures = require('../fixtures');

describe('Extend', function () {
  it('extend all sides equally with RGB', function (done) {
    sharp(fixtures.inputJpg)
      .resize(120)
      .background({r: 255, g: 0, b: 0})
      .extend(10)
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
      .background({r: 0, g: 0, b: 0, a: 0})
      .extend({top: 50, bottom: 0, left: 10, right: 35})
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
  it('partial object fails', function () {
    assert.throws(function () {
      sharp().extend({top: 1});
    });
  });

  it('should add alpha channel before extending with a transparent Background', function (done) {
    sharp(fixtures.inputJpgWithLandscapeExif1)
      .background({r: 0, g: 0, b: 0, a: 0})
      .toFormat(sharp.format.png)
      .extend({top: 0, bottom: 10, left: 0, right: 10})
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual(610, info.width);
        assert.strictEqual(460, info.height);
        fixtures.assertSimilar(fixtures.expected('addAlphaChanelBeforeExtend.png'), data, done);
      });
  });

  it('PNG with 2 channels', function (done) {
    sharp(fixtures.inputPngWithGreyAlpha)
      .background('transparent')
      .extend({top: 0, bottom: 20, left: 0, right: 20})
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
});
