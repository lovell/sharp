/*!
  Copyright 2013 Lovell Fuller and others.
  SPDX-License-Identifier: Apache-2.0
*/

import { suite, test } from 'node:test';

import sharp from '../../lib/index.js';
import fixtures from '../fixtures/index.js';

// Allow for small rounding differences between platforms
const maxDistance = 6;

suite('Tint', () => {
  test('tints rgb image red', async (t) => {
    t.plan(2);
    const output = fixtures.path('output.tint-red.jpg');
    const info = await sharp(fixtures.inputJpg)
      .resize(320, 240)
      .tint('#FF0000')
      .toFile(output);
    t.assert.strictEqual(true, info.size > 0);
    t.assert.doesNotThrow(
      () => fixtures.assertMaxColourDistance(output, fixtures.expected('tint-red.jpg'), maxDistance)
    );
  });

  test('tints rgb image green', async (t) => {
    t.plan(2);
    const output = fixtures.path('output.tint-green.jpg');
    const info = await sharp(fixtures.inputJpg)
      .resize(320, 240)
      .tint('#00FF00')
      .toFile(output);
    t.assert.strictEqual(true, info.size > 0);
    t.assert.doesNotThrow(
      () => fixtures.assertMaxColourDistance(output, fixtures.expected('tint-green.jpg'), maxDistance)
    );
  });

  test('tints rgb image blue', async (t) => {
    t.plan(2);
    const output = fixtures.path('output.tint-blue.jpg');
    const info = await sharp(fixtures.inputJpg)
      .resize(320, 240)
      .tint('#0000FF')
      .toFile(output);
    t.assert.strictEqual(true, info.size > 0);
    t.assert.doesNotThrow(
      () => fixtures.assertMaxColourDistance(output, fixtures.expected('tint-blue.jpg'), maxDistance)
    );
  });

  test('tints rgb image with sepia tone', async (t) => {
    t.plan(3);
    const output = fixtures.path('output.tint-sepia-hex.jpg');
    const info = await sharp(fixtures.inputJpg)
      .resize(320, 240)
      .tint('#704214')
      .toFile(output);
    t.assert.strictEqual(320, info.width);
    t.assert.strictEqual(240, info.height);
    t.assert.doesNotThrow(
      () => fixtures.assertMaxColourDistance(output, fixtures.expected('tint-sepia.jpg'), maxDistance)
    );
  });

  test('tints rgb image with sepia tone with rgb colour', async (t) => {
    t.plan(3);
    const output = fixtures.path('output.tint-sepia-rgb.jpg');
    const info = await sharp(fixtures.inputJpg)
      .resize(320, 240)
      .tint([112, 66, 20])
      .toFile(output);
    t.assert.strictEqual(320, info.width);
    t.assert.strictEqual(240, info.height);
    t.assert.doesNotThrow(
      () => fixtures.assertMaxColourDistance(output, fixtures.expected('tint-sepia.jpg'), maxDistance)
    );
  });

  test('tints rgb image with alpha channel', async (t) => {
    t.plan(3);
    const output = fixtures.path('output.tint-alpha.png');
    const info = await sharp(fixtures.inputPngRGBWithAlpha)
      .resize(320, 240)
      .tint('#704214')
      .toFile(output);
    t.assert.strictEqual(320, info.width);
    t.assert.strictEqual(240, info.height);
    t.assert.doesNotThrow(
      () => fixtures.assertMaxColourDistance(output, fixtures.expected('tint-alpha.png'), maxDistance)
    );
  });

  test('tints cmyk image red', async (t) => {
    t.plan(2);
    const output = fixtures.path('output.tint-cmyk.jpg');
    const info = await sharp(fixtures.inputJpgWithCmykProfile)
      .resize(320, 240)
      .tint('#FF0000')
      .toFile(output);
    t.assert.strictEqual(true, info.size > 0);
    t.assert.doesNotThrow(
      () => fixtures.assertMaxColourDistance(output, fixtures.expected('tint-cmyk.jpg'), maxDistance)
    );
  });
});
