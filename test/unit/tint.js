'use strict';

const assert = require('assert');

const sharp = require('../../');
const fixtures = require('../fixtures');

describe('Tint', function () {
  it('tints rgb image red', function (done) {
    const output = fixtures.path('output.tint-red.jpg');
    sharp(fixtures.inputJpg)
      .resize(320, 240, { fastShrinkOnLoad: false })
      .tint('#FF0000')
      .toFile(output, function (err, info) {
        if (err) throw err;
        assert.strictEqual(true, info.size > 0);
        fixtures.assertMaxColourDistance(output, fixtures.expected('tint-red.jpg'), 18);
        done();
      });
  });

  it('tints rgb image green', function (done) {
    const output = fixtures.path('output.tint-green.jpg');
    sharp(fixtures.inputJpg)
      .resize(320, 240, { fastShrinkOnLoad: false })
      .tint('#00FF00')
      .toFile(output, function (err, info) {
        if (err) throw err;
        assert.strictEqual(true, info.size > 0);
        fixtures.assertMaxColourDistance(output, fixtures.expected('tint-green.jpg'), 27);
        done();
      });
  });

  it('tints rgb image blue', function (done) {
    const output = fixtures.path('output.tint-blue.jpg');
    sharp(fixtures.inputJpg)
      .resize(320, 240, { fastShrinkOnLoad: false })
      .tint('#0000FF')
      .toFile(output, function (err, info) {
        if (err) throw err;
        assert.strictEqual(true, info.size > 0);
        fixtures.assertMaxColourDistance(output, fixtures.expected('tint-blue.jpg'), 14);
        done();
      });
  });

  it('tints rgb image with sepia tone', function (done) {
    const output = fixtures.path('output.tint-sepia.jpg');
    sharp(fixtures.inputJpg)
      .resize(320, 240, { fastShrinkOnLoad: false })
      .tint('#704214')
      .toFile(output, function (err, info) {
        if (err) throw err;
        assert.strictEqual(320, info.width);
        assert.strictEqual(240, info.height);
        fixtures.assertMaxColourDistance(output, fixtures.expected('tint-sepia.jpg'), 10);
        done();
      });
  });

  it('tints rgb image with sepia tone with rgb colour', function (done) {
    const output = fixtures.path('output.tint-sepia.jpg');
    sharp(fixtures.inputJpg)
      .resize(320, 240, { fastShrinkOnLoad: false })
      .tint([112, 66, 20])
      .toFile(output, function (err, info) {
        if (err) throw err;
        assert.strictEqual(320, info.width);
        assert.strictEqual(240, info.height);
        fixtures.assertMaxColourDistance(output, fixtures.expected('tint-sepia.jpg'), 10);
        done();
      });
  });

  it('tints rgb image with alpha channel', function (done) {
    const output = fixtures.path('output.tint-alpha.png');
    sharp(fixtures.inputPngRGBWithAlpha)
      .resize(320, 240, { fastShrinkOnLoad: false })
      .tint('#704214')
      .toFile(output, function (err, info) {
        if (err) throw err;
        assert.strictEqual(320, info.width);
        assert.strictEqual(240, info.height);
        fixtures.assertMaxColourDistance(output, fixtures.expected('tint-alpha.png'), 10);
        done();
      });
  });

  it('tints cmyk image red', function (done) {
    const output = fixtures.path('output.tint-cmyk.jpg');
    sharp(fixtures.inputJpgWithCmykProfile)
      .resize(320, 240, { fastShrinkOnLoad: false })
      .tint('#FF0000')
      .toFile(output, function (err, info) {
        if (err) throw err;
        assert.strictEqual(true, info.size > 0);
        fixtures.assertMaxColourDistance(output, fixtures.expected('tint-cmyk.jpg'), 15);
        done();
      });
  });
});
