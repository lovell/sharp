/*!
  Copyright 2013 Lovell Fuller and others.
  SPDX-License-Identifier: Apache-2.0
*/

import { suite, test } from 'node:test';

import sharp from '../../lib/index.js';
import fixtures from '../fixtures/index.js';

suite('Negate', () => {
  test('negate (jpeg)', async (t) => {
    t.plan(4);
    const { data, info } = await sharp(fixtures.inputJpg)
      .resize(320, 240)
      .negate()
      .toBuffer({ resolveWithObject: true });
    t.assert.strictEqual('jpeg', info.format);
    t.assert.strictEqual(320, info.width);
    t.assert.strictEqual(240, info.height);
    await t.assert.doesNotReject(() => fixtures.assertSimilar(fixtures.expected('negate.jpg'), data));
  });

  test('negate (png)', async (t) => {
    t.plan(4);
    const { data, info } = await sharp(fixtures.inputPng)
      .resize(320, 240)
      .negate()
      .toBuffer({ resolveWithObject: true });
    t.assert.strictEqual('png', info.format);
    t.assert.strictEqual(320, info.width);
    t.assert.strictEqual(240, info.height);
    await t.assert.doesNotReject(() => fixtures.assertSimilar(fixtures.expected('negate.png'), data));
  });

  test('negate (png, trans)', async (t) => {
    t.plan(4);
    const { data, info } = await sharp(fixtures.inputPngWithTransparency)
      .resize(320, 240)
      .negate()
      .toBuffer({ resolveWithObject: true });
    t.assert.strictEqual('png', info.format);
    t.assert.strictEqual(320, info.width);
    t.assert.strictEqual(240, info.height);
    await t.assert.doesNotReject(() => fixtures.assertSimilar(fixtures.expected('negate-trans.png'), data));
  });

  test('negate (png, alpha)', async (t) => {
    t.plan(4);
    const { data, info } = await sharp(fixtures.inputPngWithGreyAlpha)
      .resize(320, 240)
      .negate()
      .toBuffer({ resolveWithObject: true });
    t.assert.strictEqual('png', info.format);
    t.assert.strictEqual(320, info.width);
    t.assert.strictEqual(240, info.height);
    await t.assert.doesNotReject(() => fixtures.assertSimilar(fixtures.expected('negate-alpha.png'), data));
  });

  test('negate (webp)', async (t) => {
    t.plan(4);
    const { data, info } = await sharp(fixtures.inputWebP)
      .resize(320, 240)
      .negate()
      .toBuffer({ resolveWithObject: true });
    t.assert.strictEqual('webp', info.format);
    t.assert.strictEqual(320, info.width);
    t.assert.strictEqual(240, info.height);
    await t.assert.doesNotReject(() => fixtures.assertSimilar(fixtures.expected('negate.webp'), data));
  });

  test('negate (webp, trans)', async (t) => {
    t.plan(4);
    const { data, info } = await sharp(fixtures.inputWebPWithTransparency)
      .resize(320, 240)
      .negate()
      .toBuffer({ resolveWithObject: true });
    t.assert.strictEqual('webp', info.format);
    t.assert.strictEqual(320, info.width);
    t.assert.strictEqual(240, info.height);
    await t.assert.doesNotReject(() => fixtures.assertSimilar(fixtures.expected('negate-trans.webp'), data));
  });

  test('negate (true)', async (t) => {
    t.plan(4);
    const { data, info } = await sharp(fixtures.inputJpg)
      .resize(320, 240)
      .negate(true)
      .toBuffer({ resolveWithObject: true });
    t.assert.strictEqual('jpeg', info.format);
    t.assert.strictEqual(320, info.width);
    t.assert.strictEqual(240, info.height);
    await t.assert.doesNotReject(() => fixtures.assertSimilar(fixtures.expected('negate.jpg'), data));
  });

  test('negate (false)', async (t) => {
    t.plan(1);
    const output = fixtures.path('output.unmodified-by-negate.png');
    await sharp(fixtures.inputJpgWithLowContrast)
      .negate(false)
      .toFile(output);
    await t.assert.doesNotThrow(() => fixtures.assertMaxColourDistance(output, fixtures.inputJpgWithLowContrast, 0));
  });

  test('negate ({alpha: true})', async (t) => {
    t.plan(4);
    const { data, info } = await sharp(fixtures.inputJpg)
      .resize(320, 240)
      .negate({ alpha: true })
      .toBuffer({ resolveWithObject: true });
    t.assert.strictEqual('jpeg', info.format);
    t.assert.strictEqual(320, info.width);
    t.assert.strictEqual(240, info.height);
    await t.assert.doesNotReject(() => fixtures.assertSimilar(fixtures.expected('negate.jpg'), data));
  });

  test('negate non-alpha channels (png)', async (t) => {
    t.plan(4);
    const { data, info } = await sharp(fixtures.inputPng)
      .resize(320, 240)
      .negate({ alpha: false })
      .toBuffer({ resolveWithObject: true });
    t.assert.strictEqual('png', info.format);
    t.assert.strictEqual(320, info.width);
    t.assert.strictEqual(240, info.height);
    await t.assert.doesNotReject(() => fixtures.assertSimilar(fixtures.expected('negate-preserve-alpha.png'), data));
  });

  test('negate non-alpha channels (png, trans)', async (t) => {
    t.plan(4);
    const { data, info } = await sharp(fixtures.inputPngWithTransparency)
      .resize(320, 240)
      .negate({ alpha: false })
      .toBuffer({ resolveWithObject: true });
    t.assert.strictEqual('png', info.format);
    t.assert.strictEqual(320, info.width);
    t.assert.strictEqual(240, info.height);
    await t.assert.doesNotReject(() => fixtures.assertSimilar(fixtures.expected('negate-preserve-alpha-trans.png'), data));
  });

  test('negate non-alpha channels (png, alpha)', async (t) => {
    t.plan(4);
    const { data, info } = await sharp(fixtures.inputPngWithGreyAlpha)
      .resize(320, 240)
      .negate({ alpha: false })
      .toBuffer({ resolveWithObject: true });
    t.assert.strictEqual('png', info.format);
    t.assert.strictEqual(320, info.width);
    t.assert.strictEqual(240, info.height);
    await t.assert.doesNotReject(() => fixtures.assertSimilar(fixtures.expected('negate-preserve-alpha-grey.png'), data));
  });

  test('negate non-alpha channels (webp)', async (t) => {
    t.plan(4);
    const { data, info } = await sharp(fixtures.inputWebP)
      .resize(320, 240)
      .negate({ alpha: false })
      .toBuffer({ resolveWithObject: true });
    t.assert.strictEqual('webp', info.format);
    t.assert.strictEqual(320, info.width);
    t.assert.strictEqual(240, info.height);
    await t.assert.doesNotReject(() => fixtures.assertSimilar(fixtures.expected('negate-preserve-alpha.webp'), data));
  });

  test('negate non-alpha channels (webp, trans)', async (t) => {
    t.plan(4);
    const { data, info } = await sharp(fixtures.inputWebPWithTransparency)
      .resize(320, 240)
      .negate({ alpha: false })
      .toBuffer({ resolveWithObject: true });
    t.assert.strictEqual('webp', info.format);
    t.assert.strictEqual(320, info.width);
    t.assert.strictEqual(240, info.height);
    await t.assert.doesNotReject(() => fixtures.assertSimilar(fixtures.expected('negate-preserve-alpha-trans.webp'), data));
  });

  test('negate create', async (t) => {
    t.plan(1);
    const [r, g, b] = await sharp({
      create: {
        width: 1,
        height: 1,
        channels: 3,
        background: { r: 10, g: 20, b: 30 }
      }
    })
      .negate()
      .raw()
      .toBuffer();

    t.assert.deepStrictEqual({ r, g, b }, { r: 245, g: 235, b: 225 });
  });

  test('invalid alpha value', (t) => {
    t.plan(1);
    t.assert.throws(() => {
      sharp(fixtures.inputWebPWithTransparency).negate({ alpha: 'non-bool' });
    });
  });
});
