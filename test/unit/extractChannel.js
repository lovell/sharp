// Copyright 2013 Lovell Fuller and others.
// SPDX-License-Identifier: Apache-2.0

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

  it('With colorspace conversion', async () => {
    const [chroma] = await sharp({ create: { width: 1, height: 1, channels: 3, background: 'red' } })
      .toColourspace('lch')
      .extractChannel(1)
      .toBuffer();

    assert.strictEqual(chroma, 104);
  });

  it('Alpha from 16-bit PNG', function (done) {
    const output = fixtures.path('output.extract-alpha-16bit.png');
    sharp(fixtures.inputPngWithTransparency16bit)
      .resize(16)
      .extractChannel(3)
      .toFile(output, function (err) {
        if (err) throw err;
        fixtures.assertMaxColourDistance(output, fixtures.expected('extract-alpha-16bit.png'));
        done();
      });
  });

  it('Alpha from 2-channel input', function (done) {
    const output = fixtures.path('output.extract-alpha-2-channel.png');
    sharp(fixtures.inputPngWithGreyAlpha)
      .extractChannel('alpha')
      .toColourspace('b-w')
      .toFile(output, function (err, info) {
        if (err) throw err;
        assert.strictEqual(1, info.channels);
        fixtures.assertMaxColourDistance(output, fixtures.expected('extract-alpha-2-channel.png'));
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

  it('Non-existent channel', async () =>
    await assert.rejects(
      () => sharp({ create: { width: 1, height: 1, channels: 3, background: 'red' } })
        .extractChannel(3)
        .toBuffer(),
      /Cannot extract channel 3 from image with channels 0-2/
    )
  );
});
