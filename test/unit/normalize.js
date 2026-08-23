/*!
  Copyright 2013 Lovell Fuller and others.
  SPDX-License-Identifier: Apache-2.0
*/

import { suite, test } from 'node:test';

import sharp from '../../lib/index.js';
import fixtures from '../fixtures/index.js';

const assertNormalized = (t, data) => {
  let min = 255;
  let max = 0;
  for (let i = 0; i < data.length; i++) {
    min = Math.min(min, data[i]);
    max = Math.max(max, data[i]);
  }
  t.assert.strictEqual(0, min, 'min too high');
  t.assert.ok(max > 248, 'max too low');
};

suite('Normalization', () => {
  test('spreads rgb image values between 0 and 255', async (t) => {
    t.plan(2);
    const data = await sharp(fixtures.inputJpgWithLowContrast)
      .normalise()
      .raw()
      .toBuffer();
    assertNormalized(t, data);
  });

  test('spreads grayscaled image values between 0 and 255', async (t) => {
    t.plan(2);
    const data = await sharp(fixtures.inputJpgWithLowContrast)
      .greyscale()
      .normalize()
      .raw()
      .toBuffer();
    assertNormalized(t, data);
  });

  test('stretches greyscale images with alpha channel', async (t) => {
    t.plan(2);
    const data = await sharp(fixtures.inputPngWithGreyAlpha)
      .normalise()
      .raw()
      .toBuffer();
    assertNormalized(t, data);
  });

  test('keeps an existing alpha channel', async (t) => {
    t.plan(3);
    const data = await sharp(fixtures.inputPngWithTransparency)
      .resize(8, 8)
      .normalize()
      .toBuffer();
    const metadata = await sharp(data).metadata();
    t.assert.strictEqual(4, metadata.channels);
    t.assert.strictEqual(true, metadata.hasAlpha);
    t.assert.strictEqual('srgb', metadata.space);
  });

  test('keeps the alpha channel of greyscale images intact', async (t) => {
    t.plan(3);
    const data = await sharp(fixtures.inputPngWithGreyAlpha)
      .resize(8, 8)
      .normalise()
      .toBuffer();
    const metadata = await sharp(data).metadata();
    t.assert.strictEqual(true, metadata.hasAlpha);
    t.assert.strictEqual(4, metadata.channels);
    t.assert.strictEqual('srgb', metadata.space);
  });

  test('does not alter images with only one color', async (t) => {
    t.plan(1);
    const output = fixtures.path('output.unmodified-png-with-one-color.png');
    await sharp(fixtures.inputPngWithOneColor)
      .normalize()
      .toFile(output);
    await t.assert.doesNotThrow(() => fixtures.assertMaxColourDistance(output, fixtures.inputPngWithOneColor, 1E-6));
  });

  test('works with 16-bit RGBA images', async (t) => {
    t.plan(2);
    const data = await sharp(fixtures.inputPngWithTransparency16bit)
      .normalise()
      .raw()
      .toBuffer();
    assertNormalized(t, data);
  });

  test('should handle luminance range', async (t) => {
    t.plan(2);
    const data = await sharp(fixtures.inputJpgWithLowContrast)
      .normalise({ lower: 10, upper: 70 })
      .raw()
      .toBuffer();
    assertNormalized(t, data);
  });

  test('should allow lower without upper', (t) => {
    t.plan(1);
    t.assert.doesNotThrow(() => sharp().normalize({ lower: 2 }));
  });
  test('should allow upper without lower', (t) => {
    t.plan(1);
    t.assert.doesNotThrow(() => sharp().normalize({ upper: 98 }));
  });
  test('should throw when lower is out of range', (t) => {
    t.plan(1);
    t.assert.throws(
      () => sharp().normalise({ lower: -10 }),
      /Expected number between 0 and 99 for lower but received -10 of type number/
    );
  });
  test('should throw when upper is out of range', (t) => {
    t.plan(1);
    t.assert.throws(
      () => sharp().normalise({ upper: 110 }),
      /Expected number between 1 and 100 for upper but received 110 of type number/
    );
  });
  test('should throw when lower is not a number', (t) => {
    t.plan(1);
    t.assert.throws(
      () => sharp().normalise({ lower: 'fail' }),
      /Expected number between 0 and 99 for lower but received fail of type string/
    );
  });
  test('should throw when upper is not a number', (t) => {
    t.plan(1);
    t.assert.throws(
      () => sharp().normalise({ upper: 'fail' }),
      /Expected number between 1 and 100 for upper but received fail of type string/
    );
  });
  test('should throw when the lower and upper are equal', (t) => {
    t.plan(1);
    t.assert.throws(
      () => sharp().normalise({ lower: 2, upper: 2 }),
      /Expected lower to be less than upper for range but received 2 >= 2/
    );
  });
  test('should throw when the lower is greater than upper', (t) => {
    t.plan(1);
    t.assert.throws(
      () => sharp().normalise({ lower: 3, upper: 2 }),
      /Expected lower to be less than upper for range but received 3 >= 2/
    );
  });
});
