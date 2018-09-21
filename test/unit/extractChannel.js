'use strict';

const assert = require('assert');

const sharp = require('../../');
const fixtures = require('../fixtures');

describe('Image channel extraction', function () {
  it('Red channel', function (done) {
    sharp(fixtures.inputJpg)
      .extractChannel('red')
      .resize(320, 240)
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual(320, info.width);
        assert.strictEqual(240, info.height);
        fixtures.assertSimilar(fixtures.expected('extract-red.jpg'), data, done);
      });
  });

  it('Green channel', function (done) {
    sharp(fixtures.inputJpg)
      .extractChannel('green')
      .resize(320, 240)
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual(320, info.width);
        assert.strictEqual(240, info.height);
        fixtures.assertSimilar(fixtures.expected('extract-green.jpg'), data, done);
      });
  });

  it('Blue channel', function (done) {
    sharp(fixtures.inputJpg)
      .extractChannel('blue')
      .resize(320, 240)
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual(320, info.width);
        assert.strictEqual(240, info.height);
        fixtures.assertSimilar(fixtures.expected('extract-blue.jpg'), data, done);
      });
  });

  it('Blue channel by number', function (done) {
    sharp(fixtures.inputJpg)
      .extractChannel(2)
      .resize(320, 240)
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual(320, info.width);
        assert.strictEqual(240, info.height);
        fixtures.assertSimilar(fixtures.expected('extract-blue.jpg'), data, done);
      });
  });

  it('With colorspace conversion', function (done) {
    const output = fixtures.path('output.extract-lch.jpg');
    sharp(fixtures.inputJpg)
      .toColourspace('lch')
      .extractChannel(1)
      .resize(320, 240, { fastShrinkOnLoad: false })
      .toFile(output, function (err, info) {
        if (err) throw err;
        assert.strictEqual(320, info.width);
        assert.strictEqual(240, info.height);
        fixtures.assertMaxColourDistance(output, fixtures.expected('extract-lch.jpg'), 9);
        done();
      });
  });

  it('Alpha from 16-bit PNG', function (done) {
    const output = fixtures.path('output.extract-alpha-16bit.jpg');
    sharp(fixtures.inputPngWithTransparency16bit)
      .extractChannel(3)
      .toFile(output, function (err, info) {
        if (err) throw err;
        fixtures.assertMaxColourDistance(output, fixtures.expected('extract-alpha-16bit.jpg'));
        done();
      });
  });

  it('Invalid channel number', function () {
    assert.throws(function () {
      sharp(fixtures.inputJpg)
        .extractChannel(-1);
    });
  });

  it('No arguments', function () {
    assert.throws(function () {
      sharp(fixtures.inputJpg)
        .extractChannel();
    });
  });

  it('Non-existant channel', function (done) {
    sharp(fixtures.inputPng)
      .extractChannel(1)
      .toBuffer(function (err) {
        assert(err instanceof Error);
        done();
      });
  });
});
