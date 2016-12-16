'use strict';

const assert = require('assert');

const sharp = require('../../');
const fixtures = require('../fixtures');

describe('Convolve', function () {
  it('specific convolution kernel 1', function (done) {
    sharp(fixtures.inputPngStripesV)
      .convolve({
        width: 3,
        height: 3,
        scale: 50,
        offset: 0,
        kernel: [
          10, 20, 10,
          0, 0, 0,
          10, 20, 10
        ]
      })
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual('png', info.format);
        assert.strictEqual(320, info.width);
        assert.strictEqual(240, info.height);
        fixtures.assertSimilar(fixtures.expected('conv-1.png'), data, done);
      });
  });

  it('specific convolution kernel 2', function (done) {
    sharp(fixtures.inputPngStripesH)
      .convolve({
        width: 3,
        height: 3,
        kernel: [
          1, 0, 1,
          2, 0, 2,
          1, 0, 1
        ]
      })
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual('png', info.format);
        assert.strictEqual(320, info.width);
        assert.strictEqual(240, info.height);
        fixtures.assertSimilar(fixtures.expected('conv-2.png'), data, done);
      });
  });

  it('horizontal Sobel operator', function (done) {
    sharp(fixtures.inputJpg)
      .resize(320, 240)
      .convolve({
        width: 3,
        height: 3,
        kernel: [
          -1, 0, 1,
          -2, 0, 2,
          -1, 0, 1
        ]
      })
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual('jpeg', info.format);
        assert.strictEqual(320, info.width);
        assert.strictEqual(240, info.height);
        fixtures.assertSimilar(fixtures.expected('conv-sobel-horizontal.jpg'), data, done);
      });
  });

  describe('invalid kernel specification', function () {
    it('missing', function () {
      assert.throws(function () {
        sharp(fixtures.inputJpg).convolve({});
      });
    });
    it('incorrect data format', function () {
      assert.throws(function () {
        sharp(fixtures.inputJpg).convolve({
          width: 3,
          height: 3,
          kernel: [[1, 2, 3], [4, 5, 6], [7, 8, 9]]
        });
      });
    });
    it('incorrect dimensions', function () {
      assert.throws(function () {
        sharp(fixtures.inputJpg).convolve({
          width: 3,
          height: 4,
          kernel: [1, 2, 3, 4, 5, 6, 7, 8, 9]
        });
      });
    });
  });
});
