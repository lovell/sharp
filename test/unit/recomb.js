/*!
  Copyright 2013 Lovell Fuller and others.
  SPDX-License-Identifier: Apache-2.0
*/

import { suite, test } from 'node:test';

import sharp from '../../lib/index.js';
import fixtures from '../fixtures/index.js';

const sepia = [
  [0.3588, 0.7044, 0.1368],
  [0.299, 0.587, 0.114],
  [0.2392, 0.4696, 0.0912]
];

suite('Recomb', () => {
  test('applies a sepia filter using recomb', async (t) => {
    t.plan(4);
    const output = fixtures.path('output.recomb-sepia.jpg');
    const info = await sharp(fixtures.inputJpgWithLandscapeExif1)
      .recomb(sepia)
      .toFile(output);
    t.assert.strictEqual('jpeg', info.format);
    t.assert.strictEqual(600, info.width);
    t.assert.strictEqual(450, info.height);
    await t.assert.doesNotThrow(() => fixtures.assertMaxColourDistance(
      output,
      fixtures.expected('Landscape_1-recomb-sepia.jpg'),
      17
    ));
  });

  test('applies a sepia filter using recomb to an PNG with Alpha', async (t) => {
    t.plan(4);
    const output = fixtures.path('output.recomb-sepia.png');
    const info = await sharp(fixtures.inputPngAlphaPremultiplicationSmall)
      .recomb(sepia)
      .toFile(output);
    t.assert.strictEqual('png', info.format);
    t.assert.strictEqual(1024, info.width);
    t.assert.strictEqual(768, info.height);
    await t.assert.doesNotThrow(() => fixtures.assertMaxColourDistance(
      output,
      fixtures.expected('alpha-recomb-sepia.png'),
      17
    ));
  });

  test('recomb with a single channel input', async (t) => {
    t.plan(1);
    const { info } = await sharp(Buffer.alloc(64), {
      raw: {
        width: 8,
        height: 8,
        channels: 1
      }
    })
      .recomb(sepia)
      .toBuffer({ resolveWithObject: true });

    t.assert.strictEqual(3, info.channels);
  });

  test('applies a different sepia filter using recomb', async (t) => {
    t.plan(4);
    const output = fixtures.path('output.recomb-sepia2.jpg');
    const info = await sharp(fixtures.inputJpgWithLandscapeExif1)
      .recomb([
        [0.393, 0.769, 0.189],
        [0.349, 0.686, 0.168],
        [0.272, 0.534, 0.131]
      ])
      .toFile(output);
    t.assert.strictEqual('jpeg', info.format);
    t.assert.strictEqual(600, info.width);
    t.assert.strictEqual(450, info.height);
    await t.assert.doesNotThrow(() => fixtures.assertMaxColourDistance(
      output,
      fixtures.expected('Landscape_1-recomb-sepia2.jpg'),
      17
    ));
  });
  test('increases the saturation of the image', async (t) => {
    t.plan(4);
    const saturationLevel = 1;
    const output = fixtures.path('output.recomb-saturation.jpg');
    const info = await sharp(fixtures.inputJpgWithLandscapeExif1)
      .recomb([
        [
          saturationLevel + 1 - 0.2989,
          -0.587 * saturationLevel,
          -0.114 * saturationLevel
        ],
        [
          -0.2989 * saturationLevel,
          saturationLevel + 1 - 0.587,
          -0.114 * saturationLevel
        ],
        [
          -0.2989 * saturationLevel,
          -0.587 * saturationLevel,
          saturationLevel + 1 - 0.114
        ]
      ])
      .toFile(output);
    t.assert.strictEqual('jpeg', info.format);
    t.assert.strictEqual(600, info.width);
    t.assert.strictEqual(450, info.height);
    await t.assert.doesNotThrow(() => fixtures.assertMaxColourDistance(
      output,
      fixtures.expected('Landscape_1-recomb-saturation.jpg'),
      37
    ));
  });

  test('applies opacity 30% to the image', async (t) => {
    t.plan(4);
    const output = fixtures.path('output.recomb-opacity.png');
    const info = await sharp(fixtures.inputPngWithTransparent)
      .recomb([
        [1, 0, 0, 0],
        [0, 1, 0, 0],
        [0, 0, 1, 0],
        [0, 0, 0, 0.3]
      ])
      .toFile(output);
    t.assert.strictEqual('png', info.format);
    t.assert.strictEqual(48, info.width);
    t.assert.strictEqual(48, info.height);
    await t.assert.doesNotThrow(() => fixtures.assertMaxColourDistance(
      output,
      fixtures.expected('d-opacity-30.png'),
      17
    ));
  });

  suite('invalid matrix specification', () => {
    test('missing', (t) => {
      t.plan(1);
      t.assert.throws(() => {
        sharp(fixtures.inputJpg).recomb();
      });
    });
    test('incorrect flat data', (t) => {
      t.plan(1);
      t.assert.throws(() => {
        sharp(fixtures.inputJpg).recomb([1, 2, 3, 4, 5, 6, 7, 8, 9]);
      });
    });
    test('incorrect sub size', (t) => {
      t.plan(1);
      t.assert.throws(() => {
        sharp(fixtures.inputJpg).recomb([
          [1, 2, 3, 4],
          [5, 6, 7, 8],
          [1, 2, 9, 6]
        ]);
      });
    });
    test('incorrect top size', (t) => {
      t.plan(1);
      t.assert.throws(() => {
        sharp(fixtures.inputJpg).recomb([[1, 2, 3, 4], [5, 6, 7, 8]]);
      });
    });
  });
});
