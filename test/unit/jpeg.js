/*!
  Copyright 2013 Lovell Fuller and others.
  SPDX-License-Identifier: Apache-2.0
*/

import { suite, test } from 'node:test';

import sharp from '../../lib/index.js';
import fixtures from '../fixtures/index.js';

suite('JPEG', () => {
  test('JPEG quality', async (t) => {
    t.plan(2);
    const buffer70 = await sharp(fixtures.inputJpg)
      .resize(320, 240)
      .jpeg({ quality: 70 })
      .toBuffer();
    const buffer80 = await sharp(fixtures.inputJpg)
      .resize(320, 240)
      .toBuffer();
    const buffer90 = await sharp(fixtures.inputJpg)
      .resize(320, 240)
      .jpeg({ quality: 90 })
      .toBuffer();
    t.assert.ok(buffer70.length < buffer80.length);
    t.assert.ok(buffer80.length < buffer90.length);
  });

  suite('Invalid JPEG quality', () => {
    [-1, 88.2, 'test'].forEach((quality) => {
      test(quality.toString(), (t) => {
        t.plan(1);
        t.assert.throws(() => {
          sharp().jpeg({ quality });
        });
      });
    });
  });

  suite('Invalid JPEG quantisation table', () => {
    [-1, 88.2, 'test'].forEach((table) => {
      test(table.toString(), (t) => {
        t.plan(1);
        t.assert.throws(() => {
          sharp().jpeg({ quantisationTable: table });
        });
      });
    });
  });

  test('Progressive JPEG image', async (t) => {
    t.plan(11);
    const nonProgressive = await sharp(fixtures.inputJpg)
      .resize(320, 240)
      .jpeg({ progressive: false })
      .toBuffer({ resolveWithObject: true });
    t.assert.strictEqual(true, nonProgressive.data.length > 0);
    t.assert.strictEqual(nonProgressive.data.length, nonProgressive.info.size);
    t.assert.strictEqual('jpeg', nonProgressive.info.format);
    t.assert.strictEqual(320, nonProgressive.info.width);
    t.assert.strictEqual(240, nonProgressive.info.height);
    const progressive = await sharp(fixtures.inputJpg)
      .resize(320, 240)
      .jpeg({ progressive: true })
      .toBuffer({ resolveWithObject: true });
    t.assert.strictEqual(true, progressive.data.length > 0);
    t.assert.strictEqual(progressive.data.length, progressive.info.size);
    t.assert.strictEqual(false, progressive.data.length === nonProgressive.data.length);
    t.assert.strictEqual('jpeg', progressive.info.format);
    t.assert.strictEqual(320, progressive.info.width);
    t.assert.strictEqual(240, progressive.info.height);
  });

  test('Without chroma subsampling generates larger file', async (t) => {
    t.plan(11);
    // First generate with chroma subsampling (default)
    const withChromaSubsampling = await sharp(fixtures.inputJpg)
      .resize(320, 240)
      .jpeg({ chromaSubsampling: '4:2:0' })
      .toBuffer({ resolveWithObject: true });
    t.assert.strictEqual(true, withChromaSubsampling.data.length > 0);
    t.assert.strictEqual(withChromaSubsampling.data.length, withChromaSubsampling.info.size);
    t.assert.strictEqual('jpeg', withChromaSubsampling.info.format);
    t.assert.strictEqual(320, withChromaSubsampling.info.width);
    t.assert.strictEqual(240, withChromaSubsampling.info.height);
    // Then generate without
    const withoutChromaSubsampling = await sharp(fixtures.inputJpg)
      .resize(320, 240)
      .jpeg({ chromaSubsampling: '4:4:4' })
      .toBuffer({ resolveWithObject: true });
    t.assert.strictEqual(true, withoutChromaSubsampling.data.length > 0);
    t.assert.strictEqual(withoutChromaSubsampling.data.length, withoutChromaSubsampling.info.size);
    t.assert.strictEqual('jpeg', withoutChromaSubsampling.info.format);
    t.assert.strictEqual(320, withoutChromaSubsampling.info.width);
    t.assert.strictEqual(240, withoutChromaSubsampling.info.height);
    t.assert.strictEqual(true, withChromaSubsampling.data.length < withoutChromaSubsampling.data.length);
  });

  test('Invalid JPEG chromaSubsampling value throws error', (t) => {
    t.plan(1);
    t.assert.throws(() => {
      sharp().jpeg({ chromaSubsampling: '4:2:2' });
    });
  });

  test('Trellis quantisation', async (t) => {
    t.plan(11);
    // First generate without
    const without = await sharp(fixtures.inputJpg)
      .resize(320, 240)
      .jpeg({ trellisQuantisation: false })
      .toBuffer({ resolveWithObject: true });
    t.assert.strictEqual(true, without.data.length > 0);
    t.assert.strictEqual(without.data.length, without.info.size);
    t.assert.strictEqual('jpeg', without.info.format);
    t.assert.strictEqual(320, without.info.width);
    t.assert.strictEqual(240, without.info.height);
    // Then generate with
    const withTrellis = await sharp(fixtures.inputJpg)
      .resize(320, 240)
      .jpeg({ trellisQuantization: true })
      .toBuffer({ resolveWithObject: true });
    t.assert.strictEqual(true, withTrellis.data.length > 0);
    t.assert.strictEqual(withTrellis.data.length, withTrellis.info.size);
    t.assert.strictEqual('jpeg', withTrellis.info.format);
    t.assert.strictEqual(320, withTrellis.info.width);
    t.assert.strictEqual(240, withTrellis.info.height);
    // Verify image is same (as mozjpeg may not be present) size or less
    t.assert.strictEqual(true, withTrellis.data.length <= without.data.length);
  });

  test('Overshoot deringing', async (t) => {
    t.plan(10);
    // First generate without
    const without = await sharp(fixtures.inputJpg)
      .resize(320, 240)
      .jpeg({ overshootDeringing: false })
      .toBuffer({ resolveWithObject: true });
    t.assert.strictEqual(true, without.data.length > 0);
    t.assert.strictEqual(without.data.length, without.info.size);
    t.assert.strictEqual('jpeg', without.info.format);
    t.assert.strictEqual(320, without.info.width);
    t.assert.strictEqual(240, without.info.height);
    // Then generate with
    const withOvershoot = await sharp(fixtures.inputJpg)
      .resize(320, 240)
      .jpeg({ overshootDeringing: true })
      .toBuffer({ resolveWithObject: true });
    t.assert.strictEqual(true, withOvershoot.data.length > 0);
    t.assert.strictEqual(withOvershoot.data.length, withOvershoot.info.size);
    t.assert.strictEqual('jpeg', withOvershoot.info.format);
    t.assert.strictEqual(320, withOvershoot.info.width);
    t.assert.strictEqual(240, withOvershoot.info.height);
  });

  test('Optimise scans generates different output length', async (t) => {
    t.plan(11);
    // First generate without
    const without = await sharp(fixtures.inputJpg)
      .resize(320, 240)
      .jpeg({ optimiseScans: false })
      .toBuffer({ resolveWithObject: true });
    t.assert.strictEqual(true, without.data.length > 0);
    t.assert.strictEqual(without.data.length, without.info.size);
    t.assert.strictEqual('jpeg', without.info.format);
    t.assert.strictEqual(320, without.info.width);
    t.assert.strictEqual(240, without.info.height);
    // Then generate with
    const withScans = await sharp(fixtures.inputJpg)
      .resize(320, 240)
      .jpeg({ optimizeScans: true })
      .toBuffer({ resolveWithObject: true });
    t.assert.strictEqual(true, withScans.data.length > 0);
    t.assert.strictEqual(withScans.data.length, withScans.info.size);
    t.assert.strictEqual('jpeg', withScans.info.format);
    t.assert.strictEqual(320, withScans.info.width);
    t.assert.strictEqual(240, withScans.info.height);
    // Verify image is of a different size (progressive output even without mozjpeg)
    t.assert.notStrictEqual(withScans.data.length, without.data.length);
  });

  test('Optimise coding generates smaller output length', async (t) => {
    t.plan(11);
    // First generate with optimize coding enabled (default)
    const withOptimiseCoding = await sharp(fixtures.inputJpg)
      .resize(320, 240)
      .jpeg()
      .toBuffer({ resolveWithObject: true });
    t.assert.strictEqual(true, withOptimiseCoding.data.length > 0);
    t.assert.strictEqual(withOptimiseCoding.data.length, withOptimiseCoding.info.size);
    t.assert.strictEqual('jpeg', withOptimiseCoding.info.format);
    t.assert.strictEqual(320, withOptimiseCoding.info.width);
    t.assert.strictEqual(240, withOptimiseCoding.info.height);
    // Then generate with coding disabled
    const withoutOptimiseCoding = await sharp(fixtures.inputJpg)
      .resize(320, 240)
      .jpeg({ optimizeCoding: false })
      .toBuffer({ resolveWithObject: true });
    t.assert.strictEqual(true, withoutOptimiseCoding.data.length > 0);
    t.assert.strictEqual(withoutOptimiseCoding.data.length, withoutOptimiseCoding.info.size);
    t.assert.strictEqual('jpeg', withoutOptimiseCoding.info.format);
    t.assert.strictEqual(320, withoutOptimiseCoding.info.width);
    t.assert.strictEqual(240, withoutOptimiseCoding.info.height);
    // Verify optimised image is of a smaller size
    t.assert.strictEqual(true, withOptimiseCoding.data.length < withoutOptimiseCoding.data.length);
  });

  test('Specifying quantisation table provides different JPEG', async (t) => {
    t.plan(11);
    // First generate with default quantisation table
    const withDefaultQuantisationTable = await sharp(fixtures.inputJpg)
      .resize(320, 240)
      .jpeg({ optimiseCoding: false })
      .toBuffer({ resolveWithObject: true });
    t.assert.strictEqual(true, withDefaultQuantisationTable.data.length > 0);
    t.assert.strictEqual(withDefaultQuantisationTable.data.length, withDefaultQuantisationTable.info.size);
    t.assert.strictEqual('jpeg', withDefaultQuantisationTable.info.format);
    t.assert.strictEqual(320, withDefaultQuantisationTable.info.width);
    t.assert.strictEqual(240, withDefaultQuantisationTable.info.height);
    // Then generate with different quantisation table
    const withQuantTable3 = await sharp(fixtures.inputJpg)
      .resize(320, 240)
      .jpeg({ optimiseCoding: false, quantisationTable: 3 })
      .toBuffer({ resolveWithObject: true });
    t.assert.strictEqual(true, withQuantTable3.data.length > 0);
    t.assert.strictEqual(withQuantTable3.data.length, withQuantTable3.info.size);
    t.assert.strictEqual('jpeg', withQuantTable3.info.format);
    t.assert.strictEqual(320, withQuantTable3.info.width);
    t.assert.strictEqual(240, withQuantTable3.info.height);

    // Verify image is same (as mozjpeg may not be present) size or less
    t.assert.strictEqual(true, withQuantTable3.data.length <= withDefaultQuantisationTable.data.length);
  });

  test('Specifying quantization table provides different JPEG', async (t) => {
    t.plan(11);
    // First generate with default quantization table
    const withDefaultQuantizationTable = await sharp(fixtures.inputJpg)
      .resize(320, 240)
      .jpeg({ optimiseCoding: false })
      .toBuffer({ resolveWithObject: true });
    t.assert.strictEqual(true, withDefaultQuantizationTable.data.length > 0);
    t.assert.strictEqual(withDefaultQuantizationTable.data.length, withDefaultQuantizationTable.info.size);
    t.assert.strictEqual('jpeg', withDefaultQuantizationTable.info.format);
    t.assert.strictEqual(320, withDefaultQuantizationTable.info.width);
    t.assert.strictEqual(240, withDefaultQuantizationTable.info.height);
    // Then generate with different quantization table
    const withQuantTable3 = await sharp(fixtures.inputJpg)
      .resize(320, 240)
      .jpeg({ optimiseCoding: false, quantizationTable: 3 })
      .toBuffer({ resolveWithObject: true });
    t.assert.strictEqual(true, withQuantTable3.data.length > 0);
    t.assert.strictEqual(withQuantTable3.data.length, withQuantTable3.info.size);
    t.assert.strictEqual('jpeg', withQuantTable3.info.format);
    t.assert.strictEqual(320, withQuantTable3.info.width);
    t.assert.strictEqual(240, withQuantTable3.info.height);

    // Verify image is same (as mozjpeg may not be present) size or less
    t.assert.strictEqual(true, withQuantTable3.data.length <= withDefaultQuantizationTable.data.length);
  });

  test('Can use mozjpeg defaults', async (t) => {
    t.plan(2);
    const withoutData = await sharp(fixtures.inputJpg)
      .resize(32, 24)
      .jpeg({ mozjpeg: false })
      .toBuffer();
    const withoutMeta = await sharp(withoutData).metadata();
    t.assert.strictEqual(false, withoutMeta.isProgressive);

    const withData = await sharp(fixtures.inputJpg)
      .resize(32, 24)
      .jpeg({ mozjpeg: true })
      .toBuffer();
    const withMeta = await sharp(withData).metadata();
    t.assert.strictEqual(true, withMeta.isProgressive);
  });

  test('Invalid mozjpeg value throws error', (t) => {
    t.plan(1);
    t.assert.throws(() => sharp().jpeg({ mozjpeg: 'fail' }));
  });
});
