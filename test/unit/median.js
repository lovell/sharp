'use strict';

const assert = require('assert');

const sharp = require('../../');
const fixtures = require('../fixtures');

describe('Median filter', function () {
  it('1x1 window', function (done) {
    sharp(fixtures.inputJpgThRandom)
      .median(1)
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual('jpeg', info.format);
        assert.strictEqual(200, info.width);
        assert.strictEqual(200, info.height);
        fixtures.assertSimilar(fixtures.expected('median_1.jpg'), data, done);
      });
  });

  it('3x3 window', function (done) {
    sharp(fixtures.inputJpgThRandom)
      .median(3)
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual('jpeg', info.format);
        assert.strictEqual(200, info.width);
        assert.strictEqual(200, info.height);
        fixtures.assertSimilar(fixtures.expected('median_3.jpg'), data, done);
      });
  });
  it('5x5 window', function (done) {
    sharp(fixtures.inputJpgThRandom)
      .median(5)
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual('jpeg', info.format);
        assert.strictEqual(200, info.width);
        assert.strictEqual(200, info.height);
        fixtures.assertSimilar(fixtures.expected('median_5.jpg'), data, done);
      });
  });

  it('color image', function (done) {
    sharp(fixtures.inputJpgRandom)
      .median(5)
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual('jpeg', info.format);
        assert.strictEqual(200, info.width);
        assert.strictEqual(200, info.height);
        fixtures.assertSimilar(fixtures.expected('median_color.jpg'), data, done);
      });
  });

  it('no windows size', function (done) {
    sharp(fixtures.inputJpgThRandom)
      .median()
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual('jpeg', info.format);
        assert.strictEqual(200, info.width);
        assert.strictEqual(200, info.height);
        fixtures.assertSimilar(fixtures.expected('median_3.jpg'), data, done);
      });
  });
  it('invalid radius', function () {
    assert.throws(function () {
      sharp(fixtures.inputJpg).median(0.1);
    });
  });
});
