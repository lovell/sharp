/*!
  Copyright 2013 Lovell Fuller and others.
  SPDX-License-Identifier: Apache-2.0
*/

const { suite, test } = require('node:test');

const sharp = require('../../');
const fixtures = require('../fixtures');

suite('Join input images together', () => {
  test('Join two images horizontally', async (t) => {
    t.plan(6);
    const data = await sharp([
      fixtures.inputPngPalette,
      { create: { width: 68, height: 68, channels: 3, background: 'green' } }
    ], { join: { across: 2 } }).toBuffer();

    const metadata = await sharp(data).metadata();
    t.assert.strictEqual(metadata.format, 'png');
    t.assert.strictEqual(metadata.width, 136);
    t.assert.strictEqual(metadata.height, 68);
    t.assert.strictEqual(metadata.space, 'srgb');
    t.assert.strictEqual(metadata.channels, 3);
    t.assert.strictEqual(metadata.hasAlpha, false);
  });

  test('Join two images vertically with shim and alpha channel', async (t) => {
    t.plan(6);
    const data = await sharp([
      fixtures.inputPngPalette,
      { create: { width: 68, height: 68, channels: 4, background: 'green' } }
    ], { join: { across: 1, shim: 8 } }).toBuffer();

    const metadata = await sharp(data).metadata();
    t.assert.strictEqual(metadata.format, 'png');
    t.assert.strictEqual(metadata.width, 68);
    t.assert.strictEqual(metadata.height, 144);
    t.assert.strictEqual(metadata.space, 'srgb');
    t.assert.strictEqual(metadata.channels, 4);
    t.assert.strictEqual(metadata.hasAlpha, true);
  });

  test('Join four images in 2x2 grid, with centre alignment', async (t) => {
    t.plan(5);
    const output = fixtures.path('output.join2x2.png');
    const info = await sharp([
      fixtures.inputPngPalette,
      { create: { width: 128, height: 128, channels: 3, background: 'green' } },
      { create: { width: 128, height: 128, channels: 3, background: 'red' } },
      fixtures.inputPngPalette
    ], { join: { across: 2, halign: 'centre', valign: 'centre', background: 'blue' } })
      .toFile(output);

    await t.assert.doesNotThrow(() => fixtures.assertMaxColourDistance(output, fixtures.expected('join2x2.png')));

    t.assert.strictEqual(info.format, 'png');
    t.assert.strictEqual(info.width, 256);
    t.assert.strictEqual(info.height, 256);
    t.assert.strictEqual(info.channels, 3);
  });

  test('Join two images as animation', async (t) => {
    t.plan(4);
    const data = await sharp([
      fixtures.inputPngPalette,
      { create: { width: 68, height: 68, channels: 3, background: 'green' } }
    ], { join: { animated: true } }).gif().toBuffer();

    const metadata = await sharp(data).metadata();
    t.assert.strictEqual(metadata.format, 'gif');
    t.assert.strictEqual(metadata.width, 68);
    t.assert.strictEqual(metadata.height, 68);
    t.assert.strictEqual(metadata.pages, 2);
  });

  test('Empty array of inputs throws', (t) => {
    t.plan(1);
    t.assert.throws(
      () => sharp([]),
      /Expected at least two images to join/
    );
  });
  test('Attempt to recursively join throws', (t) => {
    t.plan(1);
    t.assert.throws(
      () => sharp([fixtures.inputJpg, [fixtures.inputJpg, fixtures.inputJpg]]),
      /Recursive join is unsupported/
    );
  });
  test('Attempt to set join props on non-array input throws', (t) => {
    t.plan(1);
    t.assert.throws(
      () => sharp(fixtures.inputJpg, { join: { across: 2 } }),
      /Expected input to be an array of images to join/
    );
  });
  test('Invalid animated throws', (t) => {
    t.plan(1);
    t.assert.throws(
      () => sharp([fixtures.inputJpg, fixtures.inputJpg], { join: { animated: 'fail' } }),
      /Expected boolean for join.animated but received fail of type string/
    );
  });
  test('Invalid across throws', (t) => {
    t.plan(2);
    t.assert.throws(
      () => sharp([fixtures.inputJpg, fixtures.inputJpg], { join: { across: 'fail' } }),
      /Expected integer between 1 and 100000 for join.across but received fail of type string/
    );
    t.assert.throws(
      () => sharp([fixtures.inputJpg, fixtures.inputJpg], { join: { across: 0 } }),
      /Expected integer between 1 and 100000 for join.across but received 0 of type number/
    );
  });
  test('Invalid shim throws', (t) => {
    t.plan(2);
    t.assert.throws(
      () => sharp([fixtures.inputJpg, fixtures.inputJpg], { join: { shim: 'fail' } }),
      /Expected integer between 0 and 100000 for join.shim but received fail of type string/
    );
    t.assert.throws(
      () => sharp([fixtures.inputJpg, fixtures.inputJpg], { join: { shim: -1 } }),
      /Expected integer between 0 and 100000 for join.shim but received -1 of type number/
    );
  });
  test('Invalid halign', (t) => {
    t.plan(1);
    t.assert.throws(
      () => sharp([fixtures.inputJpg, fixtures.inputJpg], { join: { halign: 'fail' } }),
      /Expected valid alignment for join.halign but received fail of type string/
    );
  });
  test('Invalid valign', (t) => {
    t.plan(1);
    t.assert.throws(
      () => sharp([fixtures.inputJpg, fixtures.inputJpg], { join: { valign: 'fail' } }),
      /Expected valid alignment for join.valign but received fail of type string/
    );
  });
});
