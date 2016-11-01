'use strict';

const assert = require('assert');

const sharp = require('../../');
const fixtures = require('../fixtures');

describe('Sharpen', function () {
  it('specific radius 10 (sigma 6)', function (done) {
    sharp(fixtures.inputJpg)
      .resize(320, 240)
      .sharpen(6)
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual('jpeg', info.format);
        assert.strictEqual(320, info.width);
        assert.strictEqual(240, info.height);
        fixtures.assertSimilar(fixtures.expected('sharpen-10.jpg'), data, done);
      });
  });

  it('specific radius 3 (sigma 1.5) and levels 0.5, 2.5', function (done) {
    sharp(fixtures.inputJpg)
      .resize(320, 240)
      .sharpen(1.5, 0.5, 2.5)
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual('jpeg', info.format);
        assert.strictEqual(320, info.width);
        assert.strictEqual(240, info.height);
        fixtures.assertSimilar(fixtures.expected('sharpen-3-0.5-2.5.jpg'), data, done);
      });
  });

  it('specific radius 5 (sigma 3.5) and levels 2, 4', function (done) {
    sharp(fixtures.inputJpg)
      .resize(320, 240)
      .sharpen(3.5, 2, 4)
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual('jpeg', info.format);
        assert.strictEqual(320, info.width);
        assert.strictEqual(240, info.height);
        fixtures.assertSimilar(fixtures.expected('sharpen-5-2-4.jpg'), data, done);
      });
  });

  if (!process.env.SHARP_TEST_WITHOUT_CACHE) {
    it('specific radius/levels with alpha channel', function (done) {
      sharp(fixtures.inputPngWithTransparency)
        .resize(320, 240)
        .sharpen(5, 4, 8)
        .toBuffer(function (err, data, info) {
          if (err) throw err;
          assert.strictEqual('png', info.format);
          assert.strictEqual(4, info.channels);
          assert.strictEqual(320, info.width);
          assert.strictEqual(240, info.height);
          fixtures.assertSimilar(fixtures.expected('sharpen-rgba.png'), data, done);
        });
    });
  }

  it('mild sharpen', function (done) {
    sharp(fixtures.inputJpg)
      .resize(320, 240)
      .sharpen()
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual('jpeg', info.format);
        assert.strictEqual(320, info.width);
        assert.strictEqual(240, info.height);
        fixtures.assertSimilar(fixtures.expected('sharpen-mild.jpg'), data, done);
      });
  });

  it('invalid sigma', function () {
    assert.throws(function () {
      sharp(fixtures.inputJpg).sharpen(-1.5);
    });
  });

  it('invalid flat', function () {
    assert.throws(function () {
      sharp(fixtures.inputJpg).sharpen(1, -1);
    });
  });

  it('invalid jagged', function () {
    assert.throws(function () {
      sharp(fixtures.inputJpg).sharpen(1, 1, -1);
    });
  });

  it('sharpened image is larger than non-sharpened', function (done) {
    sharp(fixtures.inputJpg)
      .resize(320, 240)
      .sharpen(false)
      .toBuffer(function (err, notSharpened, info) {
        if (err) throw err;
        assert.strictEqual(true, notSharpened.length > 0);
        assert.strictEqual('jpeg', info.format);
        assert.strictEqual(320, info.width);
        assert.strictEqual(240, info.height);
        sharp(fixtures.inputJpg)
          .resize(320, 240)
          .sharpen(true)
          .toBuffer(function (err, sharpened, info) {
            if (err) throw err;
            assert.strictEqual(true, sharpened.length > 0);
            assert.strictEqual(true, sharpened.length > notSharpened.length);
            assert.strictEqual('jpeg', info.format);
            assert.strictEqual(320, info.width);
            assert.strictEqual(240, info.height);
            done();
          });
      });
  });
});
