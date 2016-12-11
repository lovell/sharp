'use strict';

const assert = require('assert');

const sharp = require('../../');
const fixtures = require('../fixtures');

describe('Embed', function () {
  it('JPEG within PNG, no alpha channel', function (done) {
    sharp(fixtures.inputJpg)
      .embed()
      .resize(320, 240)
      .png()
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual(true, data.length > 0);
        assert.strictEqual('png', info.format);
        assert.strictEqual(320, info.width);
        assert.strictEqual(240, info.height);
        assert.strictEqual(3, info.channels);
        fixtures.assertSimilar(fixtures.expected('embed-3-into-3.png'), data, done);
      });
  });

  it('JPEG within WebP, to include alpha channel', function (done) {
    sharp(fixtures.inputJpg)
      .resize(320, 240)
      .background({r: 0, g: 0, b: 0, alpha: 0})
      .embed()
      .webp()
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual(true, data.length > 0);
        assert.strictEqual('webp', info.format);
        assert.strictEqual(320, info.width);
        assert.strictEqual(240, info.height);
        assert.strictEqual(4, info.channels);
        fixtures.assertSimilar(fixtures.expected('embed-3-into-4.webp'), data, done);
      });
  });

  it('PNG with alpha channel', function (done) {
    sharp(fixtures.inputPngWithTransparency)
      .resize(50, 50)
      .embed()
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual(true, data.length > 0);
        assert.strictEqual('png', info.format);
        assert.strictEqual(50, info.width);
        assert.strictEqual(50, info.height);
        assert.strictEqual(4, info.channels);
        fixtures.assertSimilar(fixtures.expected('embed-4-into-4.png'), data, done);
      });
  });

  it('16-bit PNG with alpha channel', function (done) {
    sharp(fixtures.inputPngWithTransparency16bit)
      .resize(32, 16)
      .embed()
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual(true, data.length > 0);
        assert.strictEqual('png', info.format);
        assert.strictEqual(32, info.width);
        assert.strictEqual(16, info.height);
        assert.strictEqual(4, info.channels);
        fixtures.assertSimilar(fixtures.expected('embed-16bit.png'), data, done);
      });
  });

  it('16-bit PNG with alpha channel onto RGBA', function (done) {
    sharp(fixtures.inputPngWithTransparency16bit)
      .resize(32, 16)
      .embed()
      .background({r: 0, g: 0, b: 0, alpha: 0})
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual(true, data.length > 0);
        assert.strictEqual('png', info.format);
        assert.strictEqual(32, info.width);
        assert.strictEqual(16, info.height);
        assert.strictEqual(4, info.channels);
        fixtures.assertSimilar(fixtures.expected('embed-16bit-rgba.png'), data, done);
      });
  });

  it('PNG with 2 channels', function (done) {
    sharp(fixtures.inputPngWithGreyAlpha)
      .resize(32, 16)
      .embed()
      .background({r: 0, g: 0, b: 0, alpha: 0})
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual(true, data.length > 0);
        assert.strictEqual('png', info.format);
        assert.strictEqual(32, info.width);
        assert.strictEqual(16, info.height);
        assert.strictEqual(4, info.channels);
        fixtures.assertSimilar(fixtures.expected('embed-2channel.png'), data, done);
      });
  });

  it('embed TIFF in LAB colourspace onto RGBA background', function (done) {
    sharp(fixtures.inputTiffCielab)
      .resize(64, 128)
      .embed()
      .background({r: 255, g: 102, b: 0, alpha: 0.5})
      .png()
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual(true, data.length > 0);
        assert.strictEqual('png', info.format);
        assert.strictEqual(64, info.width);
        assert.strictEqual(128, info.height);
        assert.strictEqual(4, info.channels);
        fixtures.assertSimilar(fixtures.expected('embed-lab-into-rgba.png'), data, done);
      });
  });

  it('Enlarge and embed', function (done) {
    sharp(fixtures.inputPngWithOneColor)
      .embed()
      .resize(320, 240)
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual(true, data.length > 0);
        assert.strictEqual('png', info.format);
        assert.strictEqual(320, info.width);
        assert.strictEqual(240, info.height);
        assert.strictEqual(3, info.channels);
        fixtures.assertSimilar(fixtures.expected('embed-enlarge.png'), data, done);
      });
  });
});
