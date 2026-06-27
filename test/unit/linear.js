/*!
  Copyright 2013 Lovell Fuller and others.
  SPDX-License-Identifier: Apache-2.0
*/

const { suite, test } = require('node:test');

const sharp = require('../../');
const fixtures = require('../fixtures');

suite('Linear adjustment', () => {
  const blackPoint = 70;
  const whitePoint = 203;
  const a = 255 / (whitePoint - blackPoint);
  const b = -blackPoint * a;

  test('applies linear levels adjustment w/o alpha ch', async (t) => {
    t.plan(1);
    const data = await sharp(fixtures.inputJpgWithLowContrast)
      .linear(a, b)
      .toBuffer();
    await t.assert.doesNotReject(() => fixtures.assertSimilar(fixtures.expected('low-contrast-linear.jpg'), data));
  });

  test('applies slope level adjustment w/o alpha ch', async (t) => {
    t.plan(1);
    const data = await sharp(fixtures.inputJpgWithLowContrast)
      .linear(a)
      .toBuffer();
    await t.assert.doesNotReject(() => fixtures.assertSimilar(fixtures.expected('low-contrast-slope.jpg'), data));
  });

  test('applies offset level adjustment w/o alpha ch', async (t) => {
    t.plan(1);
    const data = await sharp(fixtures.inputJpgWithLowContrast)
      .linear(null, b)
      .toBuffer();
    await t.assert.doesNotReject(() => fixtures.assertSimilar(fixtures.expected('low-contrast-offset.jpg'), data));
  });

  test('applies linear levels adjustment w alpha ch', async (t) => {
    t.plan(1);
    const data = await sharp(fixtures.inputPngOverlayLayer1)
      .resize(240)
      .linear(a, b)
      .toBuffer();
    await t.assert.doesNotReject(() => fixtures.assertSimilar(fixtures.expected('alpha-layer-1-fill-linear.png'), data));
  });

  test('applies linear levels adjustment to 16-bit w alpha ch', async (t) => {
    t.plan(1);
    const data = await sharp(fixtures.inputPngWithTransparency16bit)
      .linear(a, b)
      .png({ compressionLevel: 0 })
      .toBuffer();
    await t.assert.doesNotReject(() => fixtures.assertSimilar(fixtures.expected('linear-16bit.png'), data));
  });

  test('applies slope level adjustment w alpha ch', async (t) => {
    t.plan(1);
    const data = await sharp(fixtures.inputPngOverlayLayer1)
      .resize(240)
      .linear(a)
      .toBuffer();
    await t.assert.doesNotReject(() => fixtures.assertSimilar(fixtures.expected('alpha-layer-1-fill-slope.png'), data));
  });

  test('applies offset level adjustment w alpha ch', async (t) => {
    t.plan(1);
    const data = await sharp(fixtures.inputPngOverlayLayer1)
      .resize(240)
      .linear(null, b)
      .toBuffer();
    await t.assert.doesNotReject(() => fixtures.assertSimilar(fixtures.expected('alpha-layer-1-fill-offset.png'), data));
  });

  test('per channel level adjustment', async (t) => {
    t.plan(1);
    const data = await sharp(fixtures.inputWebP)
      .linear([0.25, 0.5, 0.75], [150, 100, 50])
      .toBuffer();
    await t.assert.doesNotReject(() => fixtures.assertSimilar(fixtures.expected('linear-per-channel.jpg'), data));
  });

  test('output is integer, not float, RGB', async (t) => {
    t.plan(2);
    const data = await sharp({ create: { width: 1, height: 1, channels: 3, background: 'red' } })
      .linear(1, 0)
      .tiff({ compression: 'none' })
      .toBuffer();

    const { channels, depth } = await sharp(data).metadata();
    t.assert.strictEqual(channels, 3);
    t.assert.strictEqual(depth, 'uchar');
  });

  test('output is integer, not float, RGBA', async (t) => {
    t.plan(2);
    const data = await sharp({ create: { width: 1, height: 1, channels: 4, background: '#ff000077' } })
      .linear(1, 0)
      .tiff({ compression: 'none' })
      .toBuffer();

    const { channels, depth } = await sharp(data).metadata();
    t.assert.strictEqual(channels, 4);
    t.assert.strictEqual(depth, 'uchar');
  });

  test('Invalid linear arguments', (t) => {
    t.plan(5);
    t.assert.throws(
      () => sharp().linear('foo'),
      /Expected number or array of numbers for a but received foo of type string/
    );
    t.assert.throws(
      () => sharp().linear(undefined, { bar: 'baz' }),
      /Expected number or array of numbers for b but received \[object Object\] of type object/
    );
    t.assert.throws(
      () => sharp().linear([], [1]),
      /Expected number or array of numbers for a but received {2}of type object/
    );
    t.assert.throws(
      () => sharp().linear([1, 2], [1]),
      /Expected a and b to be arrays of the same length/
    );
    t.assert.throws(
      () => sharp().linear([1]),
      /Expected a and b to be arrays of the same length/
    );
  });
});
