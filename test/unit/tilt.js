'use strict';

const assert = require('assert');

const sharp = require('../../');
const fixtures = require('../fixtures');

describe('Tilt the image', function () {
  it('Invalid input - no angle specified', function () {
    assert.throws(function () {
      sharp(fixtures.inputJpg).tilt();
    });
  });

  it('Invalid input - floating-point value', function () {
    assert.throws(function () {
      sharp(fixtures.inputJpg).tilt(2.5);
    });
  });

  it('Tilt image - maintain dimensions - keep image format', function (done) {
    const expected = fixtures.expected('tilt-20.jpg');
    sharp(fixtures.inputTilt)
      .tilt(20)
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual('jpeg', info.format);
        assert.strictEqual(3, info.channels);
        assert.strictEqual(880, info.width);
        assert.strictEqual(1200, info.height);
        fixtures.assertSimilar(expected, data, done);
      });
  });

  it('Tilt image - ignore dimensions - keep image format', function (done) {
    const expected = fixtures.expected('tilt-20-ignore.jpg');
    sharp(fixtures.inputTilt)
      .tilt(20)
      .ignoreAspectRatio()
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual('jpeg', info.format);
        assert.strictEqual(3, info.channels);
        assert.notStrictEqual(880, info.width);
        assert.notStrictEqual(1200, info.height);
        fixtures.assertSimilar(expected, data, done);
      });
  });

  it('Tilt image - maintain dimensions - change image format', function (done) {
    const expected = fixtures.expected('tilt-20.png');
    sharp(fixtures.inputTilt)
      .tilt(20)
      .png()
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual('png', info.format);
        assert.strictEqual(4, info.channels);
        assert.strictEqual(880, info.width);
        assert.strictEqual(1200, info.height);
        fixtures.assertSimilar(expected, data, done);
      });
  });

  it('Tilt image - ignore dimensions - change image format', function (done) {
    const expected = fixtures.expected('tilt-20-ignore.png');
    sharp(fixtures.inputTilt)
      .tilt(20)
      .ignoreAspectRatio()
      .png()
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual('png', info.format);
        assert.strictEqual(4, info.channels);
        assert.notStrictEqual(880, info.width);
        assert.notStrictEqual(1200, info.height);
        fixtures.assertSimilar(expected, data, done);
      });
  });

  it('Tilt image - use rotate when possible', function (done) {
    const expected = fixtures.expected('tilt-270-rotate.jpg');
    sharp(fixtures.inputTilt)
      .tilt(270)
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        sharp(fixtures.inputTilt)
          .rotate(270)
          .toBuffer(function (error, rotateData) {
            if (err) throw error;
            fixtures.assertSimilar(expected, data, function () {
              fixtures.assertSimilar(rotateData, data, done);
            });
          });
      });
  });
});
