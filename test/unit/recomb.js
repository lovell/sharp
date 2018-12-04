'use strict';

const assert = require('assert');

const sharp = require('../../');
const fixtures = require('../fixtures');

describe('Recomb', function () {
  it('applies a sepia filter using recomb', function (done) {
    const output = fixtures.path('output.recomb-sepia.jpg');
    sharp(fixtures.inputJpgWithLandscapeExif1)
      .recomb([
        [0.3588, 0.7044, 0.1368],
        [0.299, 0.587, 0.114],
        [0.2392, 0.4696, 0.0912]
      ])
      .toFile(output, function (err, info) {
        if (err) throw err;
        assert.strictEqual('jpeg', info.format);
        assert.strictEqual(600, info.width);
        assert.strictEqual(450, info.height);
        fixtures.assertMaxColourDistance(
          output,
          fixtures.expected('Landscape_1-recomb-sepia.jpg'),
          17
        );
        done();
      });
  });

  it('applies a sepia filter using recomb to an PNG with Alpha', function (done) {
    const output = fixtures.path('output.recomb-sepia.png');
    sharp(fixtures.inputPngAlphaPremultiplicationSmall)
      .recomb([
        [0.3588, 0.7044, 0.1368],
        [0.299, 0.587, 0.114],
        [0.2392, 0.4696, 0.0912]
      ])
      .toFile(output, function (err, info) {
        if (err) throw err;
        assert.strictEqual('png', info.format);
        assert.strictEqual(1024, info.width);
        assert.strictEqual(768, info.height);
        fixtures.assertMaxColourDistance(
          output,
          fixtures.expected('alpha-recomb-sepia.png'),
          17
        );
        done();
      });
  });

  it('applies a different sepia filter using recomb', function (done) {
    const output = fixtures.path('output.recomb-sepia2.jpg');
    sharp(fixtures.inputJpgWithLandscapeExif1)
      .recomb([
        [0.393, 0.769, 0.189],
        [0.349, 0.686, 0.168],
        [0.272, 0.534, 0.131]
      ])
      .toFile(output, function (err, info) {
        if (err) throw err;
        assert.strictEqual('jpeg', info.format);
        assert.strictEqual(600, info.width);
        assert.strictEqual(450, info.height);
        fixtures.assertMaxColourDistance(
          output,
          fixtures.expected('Landscape_1-recomb-sepia2.jpg'),
          17
        );
        done();
      });
  });
  it('increases the saturation of the image', function (done) {
    const saturationLevel = 1;
    const output = fixtures.path('output.recomb-saturation.jpg');
    sharp(fixtures.inputJpgWithLandscapeExif1)
      .recomb([
        [
          saturationLevel + 1 - 0.2989,
          -0.587 * saturationLevel,
          -0.114 * saturationLevel
        ],
        [
          -0.2989 * saturationLevel,
          saturationLevel + 1 - 0.587,
          -0.114 * saturationLevel
        ],
        [
          -0.2989 * saturationLevel,
          -0.587 * saturationLevel,
          saturationLevel + 1 - 0.114
        ]
      ])
      .toFile(output, function (err, info) {
        if (err) throw err;
        assert.strictEqual('jpeg', info.format);
        assert.strictEqual(600, info.width);
        assert.strictEqual(450, info.height);
        fixtures.assertMaxColourDistance(
          output,
          fixtures.expected('Landscape_1-recomb-saturation.jpg'),
          37
        );
        done();
      });
  });

  describe('invalid matrix specification', function () {
    it('missing', function () {
      assert.throws(function () {
        sharp(fixtures.inputJpg).recomb();
      });
    });
    it('incorrect flat data', function () {
      assert.throws(function () {
        sharp(fixtures.inputJpg).recomb([1, 2, 3, 4, 5, 6, 7, 8, 9]);
      });
    });
    it('incorrect sub size', function () {
      assert.throws(function () {
        sharp(fixtures.inputJpg).recomb([
          [1, 2, 3, 4],
          [5, 6, 7, 8],
          [1, 2, 9, 6]
        ]);
      });
    });
    it('incorrect top size', function () {
      assert.throws(function () {
        sharp(fixtures.inputJpg).recomb([[1, 2, 3, 4], [5, 6, 7, 8]]);
      });
    });
  });
});
