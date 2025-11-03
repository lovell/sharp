/*!
  Copyright 2013 Lovell Fuller and others.
  SPDX-License-Identifier: Apache-2.0
*/

const { describe, it } = require('node:test');
const assert = require('node:assert');

const sharp = require('../../');
const fixtures = require('../fixtures');

describe('Image channel extraction', () => {
  it('Red channel', (_t, done) => {
    sharp(fixtures.inputJpg)
      .extractChannel('red')
      .resize(320, 240)
      .toBuffer((err, data, info) => {
        if (err) throw err;
        assert.strictEqual(320, info.width);
        assert.strictEqual(240, info.height);
        fixtures.assertSimilar(fixtures.expected('extract-red.jpg'), data, done);
      });
  });

  it('Green channel', (_t, done) => {
    sharp(fixtures.inputJpg)
      .extractChannel('green')
      .resize(320, 240)
      .toBuffer((err, data, info) => {
        if (err) throw err;
        assert.strictEqual(320, info.width);
        assert.strictEqual(240, info.height);
        fixtures.assertSimilar(fixtures.expected('extract-green.jpg'), data, done);
      });
  });

  it('Blue channel', (_t, done) => {
    sharp(fixtures.inputJpg)
      .extractChannel('blue')
      .resize(320, 240)
      .toBuffer((err, data, info) => {
        if (err) throw err;
        assert.strictEqual(320, info.width);
        assert.strictEqual(240, info.height);
        fixtures.assertSimilar(fixtures.expected('extract-blue.jpg'), data, done);
      });
  });

  it('Blue channel by number', (_t, done) => {
    sharp(fixtures.inputJpg)
      .extractChannel(2)
      .resize(320, 240)
      .toBuffer((err, data, info) => {
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

  it('Alpha from 16-bit PNG', (_t, done) => {
    const output = fixtures.path('output.extract-alpha-16bit.png');
    sharp(fixtures.inputPngWithTransparency16bit)
      .resize(16)
      .extractChannel(3)
      .toFile(output, (err) => {
        if (err) throw err;
        fixtures.assertMaxColourDistance(output, fixtures.expected('extract-alpha-16bit.png'));
        done();
      });
  });

  it('Alpha from 2-channel input', (_t, done) => {
    const output = fixtures.path('output.extract-alpha-2-channel.png');
    sharp(fixtures.inputPngWithGreyAlpha)
      .extractChannel('alpha')
      .toFile(output, (err, info) => {
        if (err) throw err;
        assert.strictEqual(1, info.channels);
        fixtures.assertMaxColourDistance(output, fixtures.expected('extract-alpha-2-channel.png'));
        done();
      });
  });

  it('Invalid channel number', () => {
    assert.throws(() => {
      sharp(fixtures.inputJpg)
        .extractChannel(-1);
    });
  });

  it('No arguments', () => {
    assert.throws(() => {
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
