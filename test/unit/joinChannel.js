/*!
  Copyright 2013 Lovell Fuller and others.
  SPDX-License-Identifier: Apache-2.0
*/

const { suite, test } = require('node:test');
const fs = require('node:fs');

const sharp = require('../../');
const fixtures = require('../fixtures');

suite('Image channel insertion', () => {
  test('Grayscale to RGB, buffer', async (t) => {
    t.plan(4);
    const { data, info } = await sharp(fixtures.inputPng) // gray -> red
      .resize(320, 240)
      .joinChannel(fixtures.inputPngTestJoinChannel) // new green channel
      .joinChannel(fixtures.inputPngStripesH) // new blue channel
      .toBuffer({ resolveWithObject: true });
    t.assert.strictEqual(320, info.width);
    t.assert.strictEqual(240, info.height);
    t.assert.strictEqual(3, info.channels);
    await t.assert.doesNotReject(() => fixtures.assertSimilar(fixtures.expected('joinChannel-rgb.jpg'), data));
  });

  test('Grayscale to RGB, file', async (t) => {
    t.plan(4);
    const { data, info } = await sharp(fixtures.inputPng) // gray -> red
      .resize(320, 240)
      .joinChannel(fs.readFileSync(fixtures.inputPngTestJoinChannel)) // new green channel
      .joinChannel(fs.readFileSync(fixtures.inputPngStripesH)) // new blue channel
      .toBuffer({ resolveWithObject: true });
    t.assert.strictEqual(320, info.width);
    t.assert.strictEqual(240, info.height);
    t.assert.strictEqual(3, info.channels);
    await t.assert.doesNotReject(() => fixtures.assertSimilar(fixtures.expected('joinChannel-rgb.jpg'), data));
  });

  test('Grayscale to RGBA, buffer', async (t) => {
    t.plan(4);
    const { data, info } = await sharp(fixtures.inputPng) // gray -> red
      .resize(320, 240)
      .joinChannel([
        fixtures.inputPngTestJoinChannel,
        fixtures.inputPngStripesH,
        fixtures.inputPngStripesV
      ]) // new green + blue + alpha channel
      .toColourspace(sharp.colourspace.srgb)
      .toBuffer({ resolveWithObject: true });
    t.assert.strictEqual(320, info.width);
    t.assert.strictEqual(240, info.height);
    t.assert.strictEqual(4, info.channels);
    await t.assert.doesNotReject(() => fixtures.assertSimilar(fixtures.expected('joinChannel-rgba.png'), data));
  });

  test('Grayscale to RGBA, file', async (t) => {
    t.plan(4);
    const { data, info } = await sharp(fixtures.inputPng) // gray -> red
      .resize(320, 240)
      .joinChannel([
        fs.readFileSync(fixtures.inputPngTestJoinChannel), // new green channel
        fs.readFileSync(fixtures.inputPngStripesH), // new blue channel
        fs.readFileSync(fixtures.inputPngStripesV) // new alpha channel
      ])
      .toColourspace('srgb')
      .toBuffer({ resolveWithObject: true });
    t.assert.strictEqual(320, info.width);
    t.assert.strictEqual(240, info.height);
    t.assert.strictEqual(4, info.channels);
    await t.assert.doesNotReject(() => fixtures.assertSimilar(fixtures.expected('joinChannel-rgba.png'), data));
  });

  test('Grayscale to CMYK, buffers', async (t) => {
    t.plan(4);
    const { data, info } = await sharp(fixtures.inputPng) // gray -> magenta
      .resize(320, 240)
      .joinChannel([
        fs.readFileSync(fixtures.inputPngTestJoinChannel), // new cyan channel
        fs.readFileSync(fixtures.inputPngStripesH), // new yellow channel
        fs.readFileSync(fixtures.inputPngStripesV) // new black channel
      ])
      .toColorspace('cmyk')
      .toFormat('jpeg')
      .toBuffer({ resolveWithObject: true });
    t.assert.strictEqual(320, info.width);
    t.assert.strictEqual(240, info.height);
    t.assert.strictEqual(4, info.channels);
    await t.assert.doesNotReject(() => fixtures.assertSimilar(fixtures.expected('joinChannel-cmyk.jpg'), data));
  });

  test('Join raw buffers to RGB', async (t) => {
    t.plan(4);
    const buffers = await Promise.all([
      sharp(fixtures.inputPngTestJoinChannel).toColourspace('b-w').raw().toBuffer(),
      sharp(fixtures.inputPngStripesH).toColourspace('b-w').raw().toBuffer()
    ]);
    const { data, info } = await sharp(fixtures.inputPng)
      .resize(320, 240)
      .joinChannel(buffers, {
        raw: {
          width: 320,
          height: 240,
          channels: 1
        }
      })
      .toBuffer({ resolveWithObject: true });
    t.assert.strictEqual(320, info.width);
    t.assert.strictEqual(240, info.height);
    t.assert.strictEqual(3, info.channels);
    await t.assert.doesNotReject(() => fixtures.assertSimilar(fixtures.expected('joinChannel-rgb.jpg'), data));
  });

  test('Grayscale to RGBA, files, two arrays', async (t) => {
    t.plan(4);
    const { data, info } = await sharp(fixtures.inputPng) // gray -> red
      .resize(320, 240)
      .joinChannel([fs.readFileSync(fixtures.inputPngTestJoinChannel)]) // new green channel
      .joinChannel([
        fs.readFileSync(fixtures.inputPngStripesH), // new blue channel
        fs.readFileSync(fixtures.inputPngStripesV) // new alpha channel
      ])
      .toColourspace('srgb')
      .toBuffer({ resolveWithObject: true });
    t.assert.strictEqual(320, info.width);
    t.assert.strictEqual(240, info.height);
    t.assert.strictEqual(4, info.channels);
    await t.assert.doesNotReject(() => fixtures.assertSimilar(fixtures.expected('joinChannel-rgba.png'), data));
  });

  test('Invalid raw buffer description', (t) => {
    t.plan(1);
    t.assert.throws(() => {
      sharp().joinChannel(fs.readFileSync(fixtures.inputPng), { raw: {} });
    });
  });

  test('Invalid input', (t) => {
    t.plan(1);
    t.assert.throws(() => {
      sharp(fixtures.inputJpg).joinChannel(1);
    });
  });

  test('No arguments', (t) => {
    t.plan(1);
    t.assert.throws(() => {
      sharp(fixtures.inputJpg).joinChannel();
    });
  });
});
