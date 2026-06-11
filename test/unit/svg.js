/*!
  Copyright 2013 Lovell Fuller and others.
  SPDX-License-Identifier: Apache-2.0
*/

import fs from 'node:fs/promises';
import { suite, test } from 'node:test';

import sharp from '../../lib/index.js';
import fixtures from '../fixtures/index.js';

suite('SVG input', () => {
  test('Convert SVG to PNG at default 72DPI', async (t) => {
    t.plan(4);
    const { data, info } = await sharp(fixtures.inputSvg)
      .resize(1024)
      .extract({ left: 290, top: 760, width: 40, height: 40 })
      .toFormat('png')
      .toBuffer({ resolveWithObject: true });
    t.assert.strictEqual('png', info.format);
    t.assert.strictEqual(40, info.width);
    t.assert.strictEqual(40, info.height);
    await fixtures.assertSimilar(fixtures.expected('svg72.png'), data);
    t.assert.strictEqual(72, (await sharp(data).metadata()).density);
  });

  test('Convert SVG to PNG at 1200DPI', async (t) => {
    t.plan(4);
    const { data, info } = await sharp(fixtures.inputSvg, { density: 1200 })
      .resize(1024)
      .extract({ left: 290, top: 760, width: 40, height: 40 })
      .toFormat('png')
      .toBuffer({ resolveWithObject: true });
    t.assert.strictEqual('png', info.format);
    t.assert.strictEqual(40, info.width);
    t.assert.strictEqual(40, info.height);
    await fixtures.assertSimilar(fixtures.expected('svg1200.png'), data);
    t.assert.strictEqual(1200, (await sharp(data).metadata()).density);
  });

  test('Convert SVG to PNG at DPI larger than 2400', async (t) => {
    t.plan(4);
    const size = 1024;
    const metadata = await sharp(fixtures.inputSvgSmallViewBox).metadata();
    const density = (size / Math.max(metadata.width, metadata.height)) * metadata.density;
    const { data, info } = await sharp(fixtures.inputSvgSmallViewBox, { density })
      .resize(size)
      .toFormat('png')
      .toBuffer({ resolveWithObject: true });
    t.assert.strictEqual('png', info.format);
    t.assert.strictEqual(size, info.width);
    t.assert.strictEqual(size, info.height);
    await fixtures.assertSimilar(fixtures.expected('circle.png'), data);
    t.assert.strictEqual(9216, (await sharp(data).metadata()).density);
  });

  test('Convert SVG to PNG utilizing scale-on-load', async (t) => {
    t.plan(4);
    const size = 1024;
    const { data, info } = await sharp(fixtures.inputSvgSmallViewBox)
      .resize(size)
      .toFormat('png')
      .toBuffer({ resolveWithObject: true });
    t.assert.strictEqual('png', info.format);
    t.assert.strictEqual(size, info.width);
    t.assert.strictEqual(size, info.height);
    await fixtures.assertSimilar(fixtures.expected('circle.png'), data);
    t.assert.strictEqual(72, (await sharp(data).metadata()).density);
  });

  test('Convert SVG to PNG at 14.4DPI', async (t) => {
    t.plan(3);
    const { data, info } = await sharp(fixtures.inputSvg, { density: 14.4 })
      .toFormat('png')
      .toBuffer({ resolveWithObject: true });
    t.assert.strictEqual('png', info.format);
    t.assert.strictEqual(20, info.width);
    t.assert.strictEqual(20, info.height);
    await fixtures.assertSimilar(fixtures.expected('svg14.4.png'), data);
  });

  test('Convert SVG with embedded images to PNG, respecting dimensions, autoconvert to PNG', async (t) => {
    t.plan(4);
    const { data, info } = await sharp(fixtures.inputSvgWithEmbeddedImages)
      .toBuffer({ resolveWithObject: true });
    t.assert.strictEqual('png', info.format);
    t.assert.strictEqual(480, info.width);
    t.assert.strictEqual(360, info.height);
    t.assert.strictEqual(4, info.channels);
    await fixtures.assertSimilar(fixtures.expected('svg-embedded.png'), data);
  });

  test('Converts SVG with truncated embedded PNG', async (t) => {
    t.plan(4);
    const truncatedPng = await fs.readFile(fixtures.inputPngTruncated);
    const svg = `<?xml version="1.0" encoding="UTF-8"?>
      <svg width="294" height="240" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
        <image width="294" height="240" xlink:href="data:image/png;base64,${truncatedPng.toString('base64')}"/>
      </svg>`;

    const { info } = await sharp(Buffer.from(svg)).toBuffer({ resolveWithObject: true });
    t.assert.strictEqual(info.format, 'png');
    t.assert.strictEqual(info.width, 294);
    t.assert.strictEqual(info.height, 240);
    t.assert.strictEqual(info.channels, 4);
  });

  test('Can apply custom CSS', async (t) => {
    t.plan(1);
    const svg = `<?xml version="1.0" encoding="UTF-8"?>
      <svg  width="10" height="10" xmlns="http://www.w3.org/2000/svg">
        <circle cx="5" cy="5" r="4" fill="green" />
      </svg>`;
    const stylesheet = 'circle { fill: red }';

    const [r, g, b, a] = await sharp(Buffer.from(svg), { svg: { stylesheet } })
      .extract({ left: 5, top: 5, width: 1, height: 1 })
      .raw()
      .toBuffer();

    t.assert.deepEqual([r, g, b, a], [255, 0, 0, 255]);
  });

  test('Invalid stylesheet input option throws', (t) => {
    t.plan(1);
    t.assert.throws(
      () => sharp({ svg: { stylesheet: 123 } }),
      /Expected string for svg\.stylesheet but received 123 of type number/
    );
  });

  test('Valid highBitdepth input option does not throw', (t) => {
    t.plan(1);
    t.assert.doesNotThrow(
      () => sharp({ svg: { highBitdepth: true } })
    );
  });

  test('Invalid highBitdepth input option throws', (t) => {
    t.plan(1);
    t.assert.throws(
      () => sharp({ svg: { highBitdepth: 123 } }),
      /Expected boolean for svg\.highBitdepth but received 123 of type number/
    );
  });

  test('Fails to render SVG larger than 32767x32767', async (t) => {
    t.plan(1);
    await t.assert.rejects(
      () => sharp(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="32768" height="1" />')).toBuffer(),
      /Input SVG image exceeds 32767x32767 pixel limit/
    );
  });

  test('Fails to render scaled SVG larger than 32767x32767', async (t) => {
    t.plan(1);
    await t.assert.rejects(
      () => sharp(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="32767" height="1" />')).resize(32768).toBuffer(),
      /Input SVG image will exceed 32767x32767 pixel limit when scaled/
    );
  });

  test('Detects SVG passed as a string', async (t) => {
    t.plan(1);
    await t.assert.rejects(
      () => sharp('<svg xmlns="http://www.w3.org/2000/svg"></svg>').toBuffer(),
      /Input file is missing, did you mean/
    );
  });
});
