// Copyright 2013 Lovell Fuller and others.
// SPDX-License-Identifier: Apache-2.0

const assert = require('node:assert');

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

  it('specific options.sigma 10', function (done) {
    sharp(fixtures.inputJpg)
      .resize(320, 240)
      .blur({ sigma: 10 })
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

  it('invalid precision', function () {
    assert.throws(function () {
      sharp(fixtures.inputJpg).blur({ sigma: 1, precision: 'invalid' });
    }, /Expected one of: integer, float, approximate for precision but received invalid of type string/);
  });

  it('invalid minAmplitude', function () {
    assert.throws(function () {
      sharp(fixtures.inputJpg).blur({ sigma: 1, minAmplitude: 0 });
    }, /Expected number between 0.001 and 1 for minAmplitude but received 0 of type number/);

    assert.throws(function () {
      sharp(fixtures.inputJpg).blur({ sigma: 1, minAmplitude: 1.01 });
    }, /Expected number between 0.001 and 1 for minAmplitude but received 1.01 of type number/);
  });

  it('specific radius 10 and precision approximate', async () => {
    const approximate = await sharp(fixtures.inputJpg)
      .resize(320, 240)
      .blur({ sigma: 10, precision: 'approximate' })
      .toBuffer();
    const integer = await sharp(fixtures.inputJpg)
      .resize(320, 240)
      .blur(10)
      .toBuffer();

    assert.notDeepEqual(approximate, integer);
    await fixtures.assertSimilar(fixtures.expected('blur-10.jpg'), approximate);
  });

  it('specific radius 10 and minAmplitude 0.01', async () => {
    const minAmplitudeLow = await sharp(fixtures.inputJpg)
      .resize(320, 240)
      .blur({ sigma: 10, minAmplitude: 0.01 })
      .toBuffer();
    const minAmplitudeDefault = await sharp(fixtures.inputJpg)
      .resize(320, 240)
      .blur(10)
      .toBuffer();

    assert.notDeepEqual(minAmplitudeLow, minAmplitudeDefault);
    await fixtures.assertSimilar(fixtures.expected('blur-10.jpg'), minAmplitudeLow);
  });

  it('options.sigma is required if options object is passed', function () {
    assert.throws(function () {
      sharp(fixtures.inputJpg).blur({ precision: 'invalid' });
    }, /Expected number between 0.3 and 1000 for options.sigma but received undefined of type undefined/);
  });
});
