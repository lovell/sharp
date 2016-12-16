'use strict';

const assert = require('assert');

const sharp = require('../../');
const fixtures = require('../fixtures');

describe('Blur', function () {
  it('specific radius 1', function (done) {
    sharp(fixtures.inputJpg)
      .resize(320, 240)
      .blur(1)
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual('jpeg', info.format);
        assert.strictEqual(320, info.width);
        assert.strictEqual(240, info.height);
        fixtures.assertSimilar(fixtures.expected('blur-1.jpg'), data, done);
      });
  });

  it('specific radius 10', function (done) {
    sharp(fixtures.inputJpg)
      .resize(320, 240)
      .blur(10)
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual('jpeg', info.format);
        assert.strictEqual(320, info.width);
        assert.strictEqual(240, info.height);
        fixtures.assertSimilar(fixtures.expected('blur-10.jpg'), data, done);
      });
  });

  it('specific radius 0.3', function (done) {
    sharp(fixtures.inputJpg)
      .resize(320, 240)
      .blur(0.3)
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual('jpeg', info.format);
        assert.strictEqual(320, info.width);
        assert.strictEqual(240, info.height);
        fixtures.assertSimilar(fixtures.expected('blur-0.3.jpg'), data, done);
      });
  });

  it('mild blur', function (done) {
    sharp(fixtures.inputJpg)
      .resize(320, 240)
      .blur()
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual('jpeg', info.format);
        assert.strictEqual(320, info.width);
        assert.strictEqual(240, info.height);
        fixtures.assertSimilar(fixtures.expected('blur-mild.jpg'), data, done);
      });
  });

  it('invalid radius', function () {
    assert.throws(function () {
      sharp(fixtures.inputJpg).blur(0.1);
    });
  });

  it('blurred image is smaller than non-blurred', function (done) {
    sharp(fixtures.inputJpg)
      .resize(320, 240)
      .blur(false)
      .toBuffer(function (err, notBlurred, info) {
        if (err) throw err;
        assert.strictEqual(true, notBlurred.length > 0);
        assert.strictEqual('jpeg', info.format);
        assert.strictEqual(320, info.width);
        assert.strictEqual(240, info.height);
        sharp(fixtures.inputJpg)
          .resize(320, 240)
          .blur(true)
          .toBuffer(function (err, blurred, info) {
            if (err) throw err;
            assert.strictEqual(true, blurred.length > 0);
            assert.strictEqual(true, blurred.length < notBlurred.length);
            assert.strictEqual('jpeg', info.format);
            assert.strictEqual(320, info.width);
            assert.strictEqual(240, info.height);
            done();
          });
      });
  });
});
