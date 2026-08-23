/*!
  Copyright 2013 Lovell Fuller and others.
  SPDX-License-Identifier: Apache-2.0
*/

import fs from 'node:fs/promises';
import { suite, test } from 'node:test';

import sharp from '../../lib/index.js';
import fixtures from '../fixtures/index.js';

suite('JP2 output', () => {
  if (!sharp.format.jp2.input.buffer) {
    test('JP2 output should fail due to missing OpenJPEG', async (t) => {
      t.plan(1);
      await t.assert.rejects(async () =>
        sharp(fixtures.inputJpg)
          .jp2()
          .toBuffer(),
      /JP2 output requires libvips with support for OpenJPEG/
      );
    });

    test('JP2 file output should fail due to missing OpenJPEG', async (t) => {
      t.plan(1);
      await t.assert.rejects(async () => sharp(fixtures.inputJpg).toFile('test.jp2'),
        /JP2 output requires libvips with support for OpenJPEG/
      );
    });

    test('File with JP2-like suffix should not fail due to missing OpenJPEG', async (t) => {
      t.plan(1);
      const output = fixtures.path('output.failj2c');
      await t.assert.doesNotReject(
        async () => sharp(fixtures.inputPngWithOneColor).toFile(output)
      );
    });
  } else {
    test('JP2 Buffer to PNG Buffer', async (t) => {
      t.plan(6);
      const input = await fs.readFile(fixtures.inputJp2);
      const { data, info } = await sharp(input)
        .resize(8, 15)
        .png()
        .toBuffer({ resolveWithObject: true });
      t.assert.strictEqual(true, data.length > 0);
      t.assert.strictEqual(data.length, info.size);
      t.assert.strictEqual('png', info.format);
      t.assert.strictEqual(8, info.width);
      t.assert.strictEqual(15, info.height);
      t.assert.strictEqual(3, info.channels);
    });

    test('JP2 quality', async (t) => {
      t.plan(1);
      const buffer70 = await sharp(fixtures.inputJp2)
        .resize(320, 240)
        .jp2({ quality: 70 })
        .toBuffer();
      const buffer80 = await sharp(fixtures.inputJp2)
        .resize(320, 240)
        .toBuffer();
      t.assert.ok(buffer70.length < buffer80.length);
    });

    test('Without chroma subsampling generates larger file', async (t) => {
      t.plan(11);
      // First generate with chroma subsampling (default)
      const withChromaSubsampling = await sharp(fixtures.inputJp2)
        .resize(320, 240)
        .jp2({ chromaSubsampling: '4:2:0' })
        .toBuffer({ resolveWithObject: true });
      t.assert.strictEqual(true, withChromaSubsampling.data.length > 0);
      t.assert.strictEqual(withChromaSubsampling.data.length, withChromaSubsampling.info.size);
      t.assert.strictEqual('jp2', withChromaSubsampling.info.format);
      t.assert.strictEqual(320, withChromaSubsampling.info.width);
      t.assert.strictEqual(240, withChromaSubsampling.info.height);
      // Then generate without
      const withoutChromaSubsampling = await sharp(fixtures.inputJp2)
        .resize(320, 240)
        .jp2({ chromaSubsampling: '4:4:4' })
        .toBuffer({ resolveWithObject: true });
      t.assert.strictEqual(true, withoutChromaSubsampling.data.length > 0);
      t.assert.strictEqual(withoutChromaSubsampling.data.length, withoutChromaSubsampling.info.size);
      t.assert.strictEqual('jp2', withoutChromaSubsampling.info.format);
      t.assert.strictEqual(320, withoutChromaSubsampling.info.width);
      t.assert.strictEqual(240, withoutChromaSubsampling.info.height);
      t.assert.strictEqual(true, withChromaSubsampling.data.length <= withoutChromaSubsampling.data.length);
    });

    test('can use the jp2Oneshot option to handle multi-part tiled JPEG 2000 file', async (t) => {
      t.plan(5);
      const outputJpg = fixtures.path('output.jpg');
      await t.assert.rejects(
        () => sharp(fixtures.inputJp2TileParts).toFile(outputJpg)
      );
      await t.assert.doesNotReject(async () => {
        await sharp(fixtures.inputJp2TileParts, { jp2Oneshot: true }).toFile(outputJpg);
        const { format, width, height } = await sharp(outputJpg).metadata();
        t.assert.strictEqual(format, 'jpeg');
        t.assert.strictEqual(width, 320);
        t.assert.strictEqual(height, 240);
      });
    });

    test('Invalid JP2 chromaSubsampling value throws error', (t) => {
      t.plan(1);
      t.assert.throws(
        () => sharp().jp2({ chromaSubsampling: '4:2:2' }),
        /Expected one of: 4:2:0, 4:4:4 for chromaSubsampling but received 4:2:2 of type string/
      );
    });
  }

  test('valid JP2 oneshot value does not throw error', (t) => {
    t.plan(1);
    t.assert.doesNotThrow(
      () => sharp({ jp2: { oneshot: true } })
    );
  });

  test('invalid JP2 oneshot value throws error', (t) => {
    t.plan(1);
    t.assert.throws(
      () => sharp({ jp2: { oneshot: 'fail' } }),
      /Expected boolean for jp2.oneshot but received fail of type string/
    );
  });
});
