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

  it('sigma=3.5, m1=2, m2=4', (done) => {
    sharp(fixtures.inputJpg)
      .resize(320, 240)
      .sharpen({ sigma: 3.5, m1: 2, m2: 4 })
      .toBuffer()
      .then(data => fixtures.assertSimilar(fixtures.expected('sharpen-5-2-4.jpg'), data, done));
  });

  it('sigma=3.5, m1=2, m2=4, x1=2, y2=5, y3=25', (done) => {
    sharp(fixtures.inputJpg)
      .resize(320, 240)
      .sharpen({ sigma: 3.5, m1: 2, m2: 4, x1: 2, y2: 5, y3: 25 })
      .toBuffer()
      .then(data => fixtures.assertSimilar(fixtures.expected('sharpen-5-2-4.jpg'), data, done));
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

  it('invalid options.sigma', () => assert.throws(
    () => sharp().sharpen({ sigma: -1 }),
    /Expected number between 0\.01 and 10000 for options\.sigma but received -1 of type number/
  ));

  it('invalid options.m1', () => assert.throws(
    () => sharp().sharpen({ sigma: 1, m1: -1 }),
    /Expected number between 0 and 10000 for options\.m1 but received -1 of type number/
  ));

  it('invalid options.m2', () => assert.throws(
    () => sharp().sharpen({ sigma: 1, m2: -1 }),
    /Expected number between 0 and 10000 for options\.m2 but received -1 of type number/
  ));

  it('invalid options.x1', () => assert.throws(
    () => sharp().sharpen({ sigma: 1, x1: -1 }),
    /Expected number between 0 and 10000 for options\.x1 but received -1 of type number/
  ));

  it('invalid options.y2', () => assert.throws(
    () => sharp().sharpen({ sigma: 1, y2: -1 }),
    /Expected number between 0 and 10000 for options\.y2 but received -1 of type number/
  ));

  it('invalid options.y3', () => assert.throws(
    () => sharp().sharpen({ sigma: 1, y3: -1 }),
    /Expected number between 0 and 10000 for options\.y3 but received -1 of type number/
  ));

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
