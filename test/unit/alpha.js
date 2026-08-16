/*!
  Copyright 2013 Lovell Fuller and others.
  SPDX-License-Identifier: Apache-2.0
*/

import { suite, test } from 'node:test';

import fixtures from '../fixtures/index.js';
import sharp from '../../lib/index.js';

suite('Alpha transparency', () => {
  test('Flatten to black', async (t) => {
    t.plan(3);
    const { data, info } = await sharp(fixtures.inputPngWithTransparency)
      .flatten()
      .resize(400, 300)
      .toBuffer({ resolveWithObject: true });
    t.assert.strictEqual(400, info.width);
    t.assert.strictEqual(300, info.height);
    await t.assert.doesNotReject(() => fixtures.assertSimilar(fixtures.expected('flatten-black.jpg'), data));
  });

  test('Flatten to RGB orange', async (t) => {
    t.plan(3);
    const { data, info } = await sharp(fixtures.inputPngWithTransparency)
      .resize(400, 300)
      .flatten({
        background: { r: 255, g: 102, b: 0 }
      })
      .jpeg({ chromaSubsampling: '4:4:4' })
      .toBuffer({ resolveWithObject: true });
    t.assert.strictEqual(400, info.width);
    t.assert.strictEqual(300, info.height);
    await t.assert.doesNotReject(() => fixtures.assertSimilar(fixtures.expected('flatten-orange.jpg'), data));
  });

  test('Flatten to CSS/hex orange', async (t) => {
    t.plan(3);
    const { data, info } = await sharp(fixtures.inputPngWithTransparency)
      .resize(400, 300)
      .flatten({ background: '#ff6600' })
      .jpeg({ chromaSubsampling: '4:4:4' })
      .toBuffer({ resolveWithObject: true });
    t.assert.strictEqual(400, info.width);
    t.assert.strictEqual(300, info.height);
    await t.assert.doesNotReject(() => fixtures.assertSimilar(fixtures.expected('flatten-orange.jpg'), data));
  });

  test('Flatten 16-bit PNG with transparency to orange', async (t) => {
    t.plan(4);
    const output = fixtures.path('output.flatten-rgb16-orange.jpg');
    const info = await sharp(fixtures.inputPngWithTransparency16bit)
      .flatten({
        background: { r: 255, g: 102, b: 0 }
      })
      .toFile(output);
    t.assert.strictEqual(true, info.size > 0);
    t.assert.strictEqual(32, info.width);
    t.assert.strictEqual(32, info.height);
    t.assert.doesNotThrow(() => fixtures.assertMaxColourDistance(output, fixtures.expected('flatten-rgb16-orange.jpg'), 10));
  });

  test('Do not flatten', async (t) => {
    t.plan(2);
    const { info } = await sharp(fixtures.inputPngWithTransparency)
      .flatten(false)
      .toBuffer({ resolveWithObject: true });
    t.assert.strictEqual('png', info.format);
    t.assert.strictEqual(4, info.channels);
  });

  test('Ignored for JPEG', async (t) => {
    t.plan(2);
    const { info } = await sharp(fixtures.inputJpg)
      .flatten({ background: '#ff0000' })
      .toBuffer({ resolveWithObject: true });
    t.assert.strictEqual('jpeg', info.format);
    t.assert.strictEqual(3, info.channels);
  });

  test('Flatten with options but without colour does not throw', (t) => {
    t.plan(1);
    t.assert.doesNotThrow(() => {
      sharp().flatten({});
    });
  });

  test('Flatten to invalid colour throws', (t) => {
    t.plan(1);
    t.assert.throws(() => {
      sharp().flatten({ background: 1 });
    });
  });

  test('Enlargement with non-nearest neighbor interpolation shouldn’t cause dark edges', async (t) => {
    t.plan(1);
    const base = 'alpha-premultiply-enlargement-2048x1536-paper.png';
    const actual = fixtures.path(`output.${base}`);
    const expected = fixtures.expected(base);
    await sharp(fixtures.inputPngAlphaPremultiplicationSmall)
      .resize(2048, 1536)
      .toFile(actual)
      .then(() => {
        t.assert.doesNotThrow(() => fixtures.assertMaxColourDistance(actual, expected, 102));
      });
  });

  test('Reduction with non-nearest neighbor interpolation shouldn’t cause dark edges', async (t) => {
    t.plan(1);
    const base = 'alpha-premultiply-reduction-1024x768-paper.png';
    const actual = fixtures.path(`output.${base}`);
    const expected = fixtures.expected(base);
    await sharp(fixtures.inputPngAlphaPremultiplicationLarge)
      .resize(1024, 768)
      .toFile(actual)
      .then(() => {
        t.assert.doesNotThrow(() => fixtures.assertMaxColourDistance(actual, expected, 102));
      });
  });

  test('Removes alpha from fixtures with transparency, ignores those without', async (t) => {
    t.plan(6);
    await Promise.all([
      fixtures.inputPngWithTransparency,
      fixtures.inputPngWithTransparency16bit,
      fixtures.inputWebPWithTransparency,
      fixtures.inputJpg,
      fixtures.inputPng,
      fixtures.inputWebP
    ].map((input) => sharp(input)
        .resize(10)
        .removeAlpha()
        .toBuffer({ resolveWithObject: true })
        .then((result) => {
          t.assert.strictEqual(3, result.info.channels);
        })));
  });

  test('Ensures alpha from fixtures without transparency, ignores those with', async (t) => {
    t.plan(6);
    await Promise.all([
      fixtures.inputPngWithTransparency,
      fixtures.inputPngWithTransparency16bit,
      fixtures.inputWebPWithTransparency,
      fixtures.inputJpg,
      fixtures.inputPng,
      fixtures.inputWebP
    ].map((input) => sharp(input)
        .resize(10)
        .ensureAlpha()
        .png()
        .toBuffer({ resolveWithObject: true })
        .then((result) => {
          t.assert.strictEqual(4, result.info.channels);
        })));
  });

  test('Valid ensureAlpha value used for alpha channel', async (t) => {
    t.plan(1);
    const background = { r: 255, g: 0, b: 0 };
    const [r, g, b, alpha] = await sharp({
      create: {
        width: 8,
        height: 8,
        channels: 3,
        background
      }
    })
      .ensureAlpha(0.5)
      .raw()
      .toBuffer();

    t.assert.deepStrictEqual({ r, g, b, alpha }, { ...background, alpha: 127 });
  });

  test('Invalid ensureAlpha value throws', (t) => {
    t.plan(1);
    t.assert.throws(() => {
      sharp().ensureAlpha('fail');
    });
  });
});
