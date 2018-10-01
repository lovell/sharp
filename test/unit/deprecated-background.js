'use strict';

const assert = require('assert');
const fixtures = require('../fixtures');
const sharp = require('../../');

describe('Deprecated background', function () {
  it('Flatten to RGB orange', function (done) {
    sharp(fixtures.inputPngWithTransparency)
      .flatten()
      .background({r: 255, g: 102, b: 0})
      .resize(400, 300)
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual(400, info.width);
        assert.strictEqual(300, info.height);
        fixtures.assertSimilar(fixtures.expected('flatten-orange.jpg'), data, done);
      });
  });

  it('Flatten to CSS/hex orange', function (done) {
    sharp(fixtures.inputPngWithTransparency)
      .flatten()
      .background('#ff6600')
      .resize(400, 300)
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual(400, info.width);
        assert.strictEqual(300, info.height);
        fixtures.assertSimilar(fixtures.expected('flatten-orange.jpg'), data, done);
      });
  });

  it('Flatten 16-bit PNG with transparency to orange', function (done) {
    const output = fixtures.path('output.flatten-rgb16-orange.jpg');
    sharp(fixtures.inputPngWithTransparency16bit)
      .flatten()
      .background({r: 255, g: 102, b: 0})
      .toFile(output, function (err, info) {
        if (err) throw err;
        assert.strictEqual(true, info.size > 0);
        assert.strictEqual(32, info.width);
        assert.strictEqual(32, info.height);
        fixtures.assertMaxColourDistance(output, fixtures.expected('flatten-rgb16-orange.jpg'), 25);
        done();
      });
  });

  it('Ignored for JPEG', function (done) {
    sharp(fixtures.inputJpg)
      .background('#ff0000')
      .flatten()
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual('jpeg', info.format);
        assert.strictEqual(3, info.channels);
        done();
      });
  });

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
});
