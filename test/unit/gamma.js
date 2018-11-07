'use strict';

const assert = require('assert');

const sharp = require('../../');
const fixtures = require('../fixtures');

describe('Gamma correction', function () {
  it('value of 0.0 (disabled)', function (done) {
    sharp(fixtures.inputJpgWithGammaHoliness)
      .resize(129, 111)
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual('jpeg', info.format);
        assert.strictEqual(129, info.width);
        assert.strictEqual(111, info.height);
        fixtures.assertSimilar(fixtures.expected('gamma-0.0.jpg'), data, { threshold: 9 }, done);
      });
  });

  it('value of 2.2 (default)', function (done) {
    sharp(fixtures.inputJpgWithGammaHoliness)
      .resize(129, 111)
      .gamma()
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual('jpeg', info.format);
        assert.strictEqual(129, info.width);
        assert.strictEqual(111, info.height);
        fixtures.assertSimilar(fixtures.expected('gamma-2.2.jpg'), data, done);
      });
  });

  it('value of 3.0', function (done) {
    sharp(fixtures.inputJpgWithGammaHoliness)
      .resize(129, 111)
      .gamma(3)
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual('jpeg', info.format);
        assert.strictEqual(129, info.width);
        assert.strictEqual(111, info.height);
        fixtures.assertSimilar(fixtures.expected('gamma-3.0.jpg'), data, { threshold: 6 }, done);
      });
  });

  it('input value of 2.2, output value of 3.0', function (done) {
    sharp(fixtures.inputJpgWithGammaHoliness)
      .resize(129, 111)
      .gamma(2.2, 3.0)
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual('jpeg', info.format);
        assert.strictEqual(129, info.width);
        assert.strictEqual(111, info.height);
        fixtures.assertSimilar(fixtures.expected('gamma-in-2.2-out-3.0.jpg'), data, { threshold: 6 }, done);
      });
  });

  it('alpha transparency', function (done) {
    sharp(fixtures.inputPngOverlayLayer1)
      .resize(320)
      .gamma()
      .jpeg()
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual('jpeg', info.format);
        assert.strictEqual(320, info.width);
        fixtures.assertSimilar(fixtures.expected('gamma-alpha.jpg'), data, done);
      });
  });

  it('invalid first parameter value', function () {
    assert.throws(function () {
      sharp(fixtures.inputJpgWithGammaHoliness).gamma(4);
    });
  });

  it('invalid second parameter value', function () {
    assert.throws(function () {
      sharp(fixtures.inputJpgWithGammaHoliness).gamma(2.2, 4);
    });
  });
});
