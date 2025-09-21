// Copyright 2013 Lovell Fuller and others.
// SPDX-License-Identifier: Apache-2.0

const { describe, it } = require('node:test');
const assert = require('node:assert');

const sharp = require('../../');
const fixtures = require('../fixtures');

describe('Negate', function () {
  it('negate (jpeg)', function (_t, done) {
    sharp(fixtures.inputJpg)
      .resize(320, 240)
      .negate()
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual('jpeg', info.format);
        assert.strictEqual(320, info.width);
        assert.strictEqual(240, info.height);
        fixtures.assertSimilar(fixtures.expected('negate.jpg'), data, done);
      });
  });

  it('negate (png)', function (_t, done) {
    sharp(fixtures.inputPng)
      .resize(320, 240)
      .negate()
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual('png', info.format);
        assert.strictEqual(320, info.width);
        assert.strictEqual(240, info.height);
        fixtures.assertSimilar(fixtures.expected('negate.png'), data, done);
      });
  });

  it('negate (png, trans)', function (_t, done) {
    sharp(fixtures.inputPngWithTransparency)
      .resize(320, 240)
      .negate()
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual('png', info.format);
        assert.strictEqual(320, info.width);
        assert.strictEqual(240, info.height);
        fixtures.assertSimilar(fixtures.expected('negate-trans.png'), data, done);
      });
  });

  it('negate (png, alpha)', function (_t, done) {
    sharp(fixtures.inputPngWithGreyAlpha)
      .resize(320, 240)
      .negate()
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual('png', info.format);
        assert.strictEqual(320, info.width);
        assert.strictEqual(240, info.height);
        fixtures.assertSimilar(fixtures.expected('negate-alpha.png'), data, done);
      });
  });

  it('negate (webp)', function (_t, done) {
    sharp(fixtures.inputWebP)
      .resize(320, 240)
      .negate()
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual('webp', info.format);
        assert.strictEqual(320, info.width);
        assert.strictEqual(240, info.height);
        fixtures.assertSimilar(fixtures.expected('negate.webp'), data, done);
      });
  });

  it('negate (webp, trans)', function (_t, done) {
    sharp(fixtures.inputWebPWithTransparency)
      .resize(320, 240)
      .negate()
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual('webp', info.format);
        assert.strictEqual(320, info.width);
        assert.strictEqual(240, info.height);
        fixtures.assertSimilar(fixtures.expected('negate-trans.webp'), data, done);
      });
  });

  it('negate (true)', function (_t, done) {
    sharp(fixtures.inputJpg)
      .resize(320, 240)
      .negate(true)
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual('jpeg', info.format);
        assert.strictEqual(320, info.width);
        assert.strictEqual(240, info.height);
        fixtures.assertSimilar(fixtures.expected('negate.jpg'), data, done);
      });
  });

  it('negate (false)', function (_t, done) {
    const output = fixtures.path('output.unmodified-by-negate.png');
    sharp(fixtures.inputJpgWithLowContrast)
      .negate(false)
      .toFile(output, function (err) {
        if (err) throw err;
        fixtures.assertMaxColourDistance(output, fixtures.inputJpgWithLowContrast, 0);
        done();
      });
  });

  it('negate ({alpha: true})', function (_t, done) {
    sharp(fixtures.inputJpg)
      .resize(320, 240)
      .negate({ alpha: true })
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual('jpeg', info.format);
        assert.strictEqual(320, info.width);
        assert.strictEqual(240, info.height);
        fixtures.assertSimilar(fixtures.expected('negate.jpg'), data, done);
      });
  });

  it('negate non-alpha channels (png)', function (_t, done) {
    sharp(fixtures.inputPng)
      .resize(320, 240)
      .negate({ alpha: false })
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual('png', info.format);
        assert.strictEqual(320, info.width);
        assert.strictEqual(240, info.height);
        fixtures.assertSimilar(fixtures.expected('negate-preserve-alpha.png'), data, done);
      });
  });

  it('negate non-alpha channels (png, trans)', function (_t, done) {
    sharp(fixtures.inputPngWithTransparency)
      .resize(320, 240)
      .negate({ alpha: false })
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual('png', info.format);
        assert.strictEqual(320, info.width);
        assert.strictEqual(240, info.height);
        fixtures.assertSimilar(fixtures.expected('negate-preserve-alpha-trans.png'), data, done);
      });
  });

  it('negate non-alpha channels (png, alpha)', function (_t, done) {
    sharp(fixtures.inputPngWithGreyAlpha)
      .resize(320, 240)
      .negate({ alpha: false })
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual('png', info.format);
        assert.strictEqual(320, info.width);
        assert.strictEqual(240, info.height);
        fixtures.assertSimilar(fixtures.expected('negate-preserve-alpha-grey.png'), data, done);
      });
  });

  it('negate non-alpha channels (webp)', function (_t, done) {
    sharp(fixtures.inputWebP)
      .resize(320, 240)
      .negate({ alpha: false })
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual('webp', info.format);
        assert.strictEqual(320, info.width);
        assert.strictEqual(240, info.height);
        fixtures.assertSimilar(fixtures.expected('negate-preserve-alpha.webp'), data, done);
      });
  });

  it('negate non-alpha channels (webp, trans)', function (_t, done) {
    sharp(fixtures.inputWebPWithTransparency)
      .resize(320, 240)
      .negate({ alpha: false })
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual('webp', info.format);
        assert.strictEqual(320, info.width);
        assert.strictEqual(240, info.height);
        fixtures.assertSimilar(fixtures.expected('negate-preserve-alpha-trans.webp'), data, done);
      });
  });

  it('negate create', async () => {
    const [r, g, b] = await sharp({
      create: {
        width: 1,
        height: 1,
        channels: 3,
        background: { r: 10, g: 20, b: 30 }
      }
    })
      .negate()
      .raw()
      .toBuffer();

    assert.deepStrictEqual({ r, g, b }, { r: 245, g: 235, b: 225 });
  });

  it('invalid alpha value', function () {
    assert.throws(function () {
      sharp(fixtures.inputWebPWithTransparency).negate({ alpha: 'non-bool' });
    });
  });
});
