'use strict';

const assert = require('assert');

const sharp = require('../../');
const fixtures = require('../fixtures');

describe('WebP', function () {
  it('WebP output', function (done) {
    sharp(fixtures.inputJpg)
      .resize(320, 240)
      .toFormat(sharp.format.webp)
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual(true, data.length > 0);
        assert.strictEqual('webp', info.format);
        assert.strictEqual(320, info.width);
        assert.strictEqual(240, info.height);
        done();
      });
  });

  it('Invalid WebP quality throws error', function () {
    assert.throws(function () {
      sharp().webp({ quality: 101 });
    });
  });

  it('Invalid WebP alpha quality throws error', function () {
    assert.throws(function () {
      sharp().webp({ alphaQuality: 101 });
    });
  });

  it('should work for webp alpha quality', function (done) {
    sharp(fixtures.inputPngAlphaPremultiplicationSmall)
      .webp({ alphaQuality: 80 })
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual(true, data.length > 0);
        assert.strictEqual('webp', info.format);
        fixtures.assertSimilar(fixtures.expected('webp-alpha-80.webp'), data, done);
      });
  });

  it('should work for webp lossless', function (done) {
    sharp(fixtures.inputPngAlphaPremultiplicationSmall)
      .webp({ lossless: true })
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual(true, data.length > 0);
        assert.strictEqual('webp', info.format);
        fixtures.assertSimilar(fixtures.expected('webp-lossless.webp'), data, done);
      });
  });

  it('should work for webp near-lossless', function (done) {
    sharp(fixtures.inputPngAlphaPremultiplicationSmall)
      .webp({ nearLossless: true, quality: 50 })
      .toBuffer(function (err50, data50, info50) {
        if (err50) throw err50;
        assert.strictEqual(true, data50.length > 0);
        assert.strictEqual('webp', info50.format);
        fixtures.assertSimilar(fixtures.expected('webp-near-lossless-50.webp'), data50, done);
      });
  });

  it('should use near-lossless when both lossless and nearLossless are specified', function (done) {
    sharp(fixtures.inputPngAlphaPremultiplicationSmall)
      .webp({ nearLossless: true, quality: 50, lossless: true })
      .toBuffer(function (err50, data50, info50) {
        if (err50) throw err50;
        assert.strictEqual(true, data50.length > 0);
        assert.strictEqual('webp', info50.format);
        fixtures.assertSimilar(fixtures.expected('webp-near-lossless-50.webp'), data50, done);
      });
  });
});
