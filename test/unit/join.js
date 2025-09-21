// Copyright 2013 Lovell Fuller and others.
// SPDX-License-Identifier: Apache-2.0

const { describe, it } = require('node:test');
const assert = require('node:assert');

const sharp = require('../../');
const fixtures = require('../fixtures');

describe('Join input images together', function () {
  it('Join two images horizontally', async () => {
    const data = await sharp([
      fixtures.inputPngPalette,
      { create: { width: 68, height: 68, channels: 3, background: 'green' } }
    ], { join: { across: 2 } }).toBuffer();

    const metadata = await sharp(data).metadata();
    assert.strictEqual(metadata.format, 'png');
    assert.strictEqual(metadata.width, 136);
    assert.strictEqual(metadata.height, 68);
    assert.strictEqual(metadata.space, 'srgb');
    assert.strictEqual(metadata.channels, 3);
    assert.strictEqual(metadata.hasAlpha, false);
  });

  it('Join two images vertically with shim and alpha channel', async () => {
    const data = await sharp([
      fixtures.inputPngPalette,
      { create: { width: 68, height: 68, channels: 4, background: 'green' } }
    ], { join: { across: 1, shim: 8 } }).toBuffer();

    const metadata = await sharp(data).metadata();
    assert.strictEqual(metadata.format, 'png');
    assert.strictEqual(metadata.width, 68);
    assert.strictEqual(metadata.height, 144);
    assert.strictEqual(metadata.space, 'srgb');
    assert.strictEqual(metadata.channels, 4);
    assert.strictEqual(metadata.hasAlpha, true);
  });

  it('Join four images in 2x2 grid, with centre alignment', async () => {
    const output = fixtures.path('output.join2x2.png');
    const info = await sharp([
      fixtures.inputPngPalette,
      { create: { width: 128, height: 128, channels: 3, background: 'green' } },
      { create: { width: 128, height: 128, channels: 3, background: 'red' } },
      fixtures.inputPngPalette
    ], { join: { across: 2, halign: 'centre', valign: 'centre', background: 'blue' } })
      .toFile(output);

    fixtures.assertMaxColourDistance(output, fixtures.expected('join2x2.png'));

    assert.strictEqual(info.format, 'png');
    assert.strictEqual(info.width, 256);
    assert.strictEqual(info.height, 256);
    assert.strictEqual(info.channels, 3);
  });

  it('Join two images as animation', async () => {
    const data = await sharp([
      fixtures.inputPngPalette,
      { create: { width: 68, height: 68, channels: 3, background: 'green' } }
    ], { join: { animated: true } }).gif().toBuffer();

    const metadata = await sharp(data).metadata();
    assert.strictEqual(metadata.format, 'gif');
    assert.strictEqual(metadata.width, 68);
    assert.strictEqual(metadata.height, 68);
    assert.strictEqual(metadata.pages, 2);
  });

  it('Empty array of inputs throws', () => {
    assert.throws(
      () => sharp([]),
      /Expected at least two images to join/
    );
  });
  it('Attempt to recursively join throws', () => {
    assert.throws(
      () => sharp([fixtures.inputJpg, [fixtures.inputJpg, fixtures.inputJpg]]),
      /Recursive join is unsupported/
    );
  });
  it('Attempt to set join props on non-array input throws', () => {
    assert.throws(
      () => sharp(fixtures.inputJpg, { join: { across: 2 } }),
      /Expected input to be an array of images to join/
    );
  });
  it('Invalid animated throws', () => {
    assert.throws(
      () => sharp([fixtures.inputJpg, fixtures.inputJpg], { join: { animated: 'fail' } }),
      /Expected boolean for join.animated but received fail of type string/
    );
  });
  it('Invalid across throws', () => {
    assert.throws(
      () => sharp([fixtures.inputJpg, fixtures.inputJpg], { join: { across: 'fail' } }),
      /Expected integer between 1 and 100000 for join.across but received fail of type string/
    );
    assert.throws(
      () => sharp([fixtures.inputJpg, fixtures.inputJpg], { join: { across: 0 } }),
      /Expected integer between 1 and 100000 for join.across but received 0 of type number/
    );
  });
  it('Invalid shim throws', () => {
    assert.throws(
      () => sharp([fixtures.inputJpg, fixtures.inputJpg], { join: { shim: 'fail' } }),
      /Expected integer between 0 and 100000 for join.shim but received fail of type string/
    );
    assert.throws(
      () => sharp([fixtures.inputJpg, fixtures.inputJpg], { join: { shim: -1 } }),
      /Expected integer between 0 and 100000 for join.shim but received -1 of type number/
    );
  });
  it('Invalid halign', () => {
    assert.throws(
      () => sharp([fixtures.inputJpg, fixtures.inputJpg], { join: { halign: 'fail' } }),
      /Expected valid alignment for join.halign but received fail of type string/
    );
  });
  it('Invalid valign', () => {
    assert.throws(
      () => sharp([fixtures.inputJpg, fixtures.inputJpg], { join: { valign: 'fail' } }),
      /Expected valid alignment for join.valign but received fail of type string/
    );
  });
});
