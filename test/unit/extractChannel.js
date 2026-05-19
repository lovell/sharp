/*!
  Copyright 2013 Lovell Fuller and others.
  SPDX-License-Identifier: Apache-2.0
*/

const { suite, test } = require('node:test');

const sharp = require('../../');
const fixtures = require('../fixtures');

suite('Image channel extraction', () => {
  test('Red channel', async (t) => {
    t.plan(3);
    const { data, info } = await sharp(fixtures.inputJpg)
      .extractChannel('red')
      .resize(320, 240)
      .toBuffer({ resolveWithObject: true });
    t.assert.strictEqual(320, info.width);
    t.assert.strictEqual(240, info.height);
    await t.assert.doesNotReject(() => fixtures.assertSimilar(fixtures.expected('extract-red.jpg'), data));
  });

  test('Green channel', async (t) => {
    t.plan(3);
    const { data, info } = await sharp(fixtures.inputJpg)
      .extractChannel('green')
      .resize(320, 240)
      .toBuffer({ resolveWithObject: true });
    t.assert.strictEqual(320, info.width);
    t.assert.strictEqual(240, info.height);
    await t.assert.doesNotReject(() => fixtures.assertSimilar(fixtures.expected('extract-green.jpg'), data));
  });

  test('Blue channel', async (t) => {
    t.plan(3);
    const { data, info } = await sharp(fixtures.inputJpg)
      .extractChannel('blue')
      .resize(320, 240)
      .toBuffer({ resolveWithObject: true });
    t.assert.strictEqual(320, info.width);
    t.assert.strictEqual(240, info.height);
    await t.assert.doesNotReject(() => fixtures.assertSimilar(fixtures.expected('extract-blue.jpg'), data));
  });

  test('Blue channel by number', async (t) => {
    t.plan(3);
    const { data, info } = await sharp(fixtures.inputJpg)
      .extractChannel(2)
      .resize(320, 240)
      .toBuffer({ resolveWithObject: true });
    t.assert.strictEqual(320, info.width);
    t.assert.strictEqual(240, info.height);
    await t.assert.doesNotReject(() => fixtures.assertSimilar(fixtures.expected('extract-blue.jpg'), data));
  });

  test('With colorspace conversion', async (t) => {
    t.plan(1);
    const [chroma] = await sharp({ create: { width: 1, height: 1, channels: 3, background: 'red' } })
      .toColourspace('lch')
      .extractChannel(1)
      .toBuffer();

    t.assert.strictEqual(chroma, 104);
  });

  test('Alpha from 16-bit PNG', async (t) => {
    t.plan(1);
    const output = fixtures.path('output.extract-alpha-16bit.png');
    await sharp(fixtures.inputPngWithTransparency16bit)
      .resize(16)
      .extractChannel(3)
      .toFile(output);
    await t.assert.doesNotThrow(() => fixtures.assertMaxColourDistance(output, fixtures.expected('extract-alpha-16bit.png')));
  });

  test('Alpha from 2-channel input', async (t) => {
    t.plan(2);
    const output = fixtures.path('output.extract-alpha-2-channel.png');
    const info = await sharp(fixtures.inputPngWithGreyAlpha)
      .extractChannel('alpha')
      .toFile(output);
    t.assert.strictEqual(1, info.channels);
    await t.assert.doesNotThrow(() => fixtures.assertMaxColourDistance(output, fixtures.expected('extract-alpha-2-channel.png')));
  });

  test('Invalid channel number', (t) => {
    t.plan(1);
    t.assert.throws(() => {
      sharp(fixtures.inputJpg)
        .extractChannel(-1);
    });
  });

  test('No arguments', (t) => {
    t.plan(1);
    t.assert.throws(() => {
      sharp(fixtures.inputJpg)
        .extractChannel();
    });
  });

  test('Non-existent channel', async (t) => {
    t.plan(1);
    await t.assert.rejects(
      () => sharp({ create: { width: 1, height: 1, channels: 3, background: 'red' } })
        .extractChannel(3)
        .toBuffer(),
      /Cannot extract channel 3 from image with channels 0-2/
    );
  });
});
