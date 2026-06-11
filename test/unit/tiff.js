/*!
  Copyright 2013 Lovell Fuller and others.
  SPDX-License-Identifier: Apache-2.0
*/

import fs from 'node:fs/promises';
import { suite, test } from 'node:test';

import sharp from '../../lib/index.js';
import fixtures from '../fixtures/index.js';

const outputTiff = fixtures.path('output.tiff');

suite('TIFF', () => {
  test('Load TIFF from Buffer', async (t) => {
    t.plan(5);
    const inputTiffBuffer = await fs.readFile(fixtures.inputTiff);
    const { data, info } = await sharp(inputTiffBuffer)
      .resize(320, 240)
      .jpeg()
      .toBuffer({ resolveWithObject: true });
    t.assert.strictEqual(true, data.length > 0);
    t.assert.strictEqual(data.length, info.size);
    t.assert.strictEqual('jpeg', info.format);
    t.assert.strictEqual(320, info.width);
    t.assert.strictEqual(240, info.height);
  });

  test('Load multi-page TIFF from file', async (t) => {
    t.plan(8);
    const { data: defaultData, info: defaultInfo } = await sharp(fixtures.inputTiffMultipage) // defaults to page 0
      .jpeg()
      .toBuffer({ resolveWithObject: true });
    t.assert.strictEqual(true, defaultData.length > 0);
    t.assert.strictEqual(defaultData.length, defaultInfo.size);
    t.assert.strictEqual('jpeg', defaultInfo.format);
    const { data: scaledData, info: scaledInfo } = await sharp(fixtures.inputTiffMultipage, { page: 1 }) // 50%-scale copy of page 0
      .jpeg()
      .toBuffer({ resolveWithObject: true });
    t.assert.strictEqual(true, scaledData.length > 0);
    t.assert.strictEqual(scaledData.length, scaledInfo.size);
    t.assert.strictEqual('jpeg', scaledInfo.format);
    t.assert.strictEqual(defaultInfo.width, scaledInfo.width * 2);
    t.assert.strictEqual(defaultInfo.height, scaledInfo.height * 2);
  });

  test('Load multi-page TIFF from Buffer', async (t) => {
    t.plan(8);
    const inputTiffBuffer = await fs.readFile(fixtures.inputTiffMultipage);
    const { data: defaultData, info: defaultInfo } = await sharp(inputTiffBuffer) // defaults to page 0
      .jpeg()
      .toBuffer({ resolveWithObject: true });
    t.assert.strictEqual(true, defaultData.length > 0);
    t.assert.strictEqual(defaultData.length, defaultInfo.size);
    t.assert.strictEqual('jpeg', defaultInfo.format);
    const { data: scaledData, info: scaledInfo } = await sharp(inputTiffBuffer, { page: 1 }) // 50%-scale copy of page 0
      .jpeg()
      .toBuffer({ resolveWithObject: true });
    t.assert.strictEqual(true, scaledData.length > 0);
    t.assert.strictEqual(scaledData.length, scaledInfo.size);
    t.assert.strictEqual('jpeg', scaledInfo.format);
    t.assert.strictEqual(defaultInfo.width, scaledInfo.width * 2);
    t.assert.strictEqual(defaultInfo.height, scaledInfo.height * 2);
  });

  test('Save TIFF to Buffer', async (t) => {
    t.plan(5);
    const { data, info } = await sharp(fixtures.inputTiff)
      .resize(320, 240)
      .toBuffer({ resolveWithObject: true });
    t.assert.strictEqual(true, data.length > 0);
    t.assert.strictEqual(data.length, info.size);
    t.assert.strictEqual('tiff', info.format);
    t.assert.strictEqual(320, info.width);
    t.assert.strictEqual(240, info.height);
  });

  test('Increasing TIFF quality increases file size', async (t) => {
    t.plan(1);
    const tiff40 = await sharp(fixtures.inputJpgWithLandscapeExif1)
      .resize(320, 240)
      .tiff({ quality: 40 })
      .toBuffer();
    const tiff90 = await sharp(fixtures.inputJpgWithLandscapeExif1)
      .resize(320, 240)
      .tiff({ quality: 90 })
      .toBuffer();
    return t.assert.strictEqual(true, tiff40.length < tiff90.length);
  });

  test('Invalid TIFF quality throws error', (t) => {
    t.plan(1);
    t.assert.throws(() => {
      sharp().tiff({ quality: 101 });
    });
  });

  test('Missing TIFF quality does not throw error', (t) => {
    t.plan(1);
    t.assert.doesNotThrow(() => {
      sharp().tiff();
    });
  });

  test('Not squashing TIFF to a bit depth of 1 should not change the file size', async (t) => {
    t.plan(2);
    const start = await fs.stat(fixtures.inputTiff8BitDepth);
    const info = await sharp(fixtures.inputTiff8BitDepth)
      .toColourspace('b-w') // can only squash 1 band uchar images
      .tiff({
        compression: 'none',
        predictor: 'none'
      })
      .toFile(outputTiff);
    t.assert.strictEqual('tiff', info.format);
    t.assert.strictEqual(start.size, info.size);
    await fs.rm(outputTiff);
  });

  test('Squashing TIFF to a bit depth of 1 should significantly reduce file size', async (t) => {
    t.plan(2);
    const start = await fs.stat(fixtures.inputTiff8BitDepth);
    const info = await sharp(fixtures.inputTiff8BitDepth)
      .toColourspace('b-w') // can only squash 1 band uchar images
      .tiff({
        bitdepth: 1,
        compression: 'none',
        predictor: 'none'
      })
      .toFile(outputTiff);
    t.assert.strictEqual('tiff', info.format);
    t.assert.ok(info.size < (start.size / 2));
    await fs.rm(outputTiff);
  });

  test('Invalid TIFF bitdepth value throws error', (t) => {
    t.plan(1);
    t.assert.throws(() => {
      sharp().tiff({ bitdepth: 3 });
    }, /Error: Expected 1, 2 or 4 for bitdepth but received 3 of type number/);
  });

  test('TIFF setting xres and yres on file', async (t) => {
    t.plan(1);
    await sharp(fixtures.inputTiff)
      .resize(8, 8)
      .tiff({
        xres: 1000,
        yres: 1000
      })
      .toFile(outputTiff);
    const { density } = await sharp(outputTiff)
      .metadata();
    t.assert.strictEqual(25400, density);
    return await fs.rm(outputTiff);
  });

  test('TIFF setting xres and yres on buffer', async (t) => {
    t.plan(1);
    const data = await sharp(fixtures.inputTiff)
      .resize(8, 8)
      .tiff({
        xres: 1000,
        yres: 1000
      })
      .toBuffer();
    const { density } = await sharp(data)
      .metadata();
    t.assert.strictEqual(25400, density);
  });

  test('TIFF imputes xres and yres from withMetadataDensity if not explicitly provided', async (t) => {
    t.plan(1);
    const data = await sharp(fixtures.inputTiff)
      .resize(8, 8)
      .tiff()
      .withMetadata({ density: 600 })
      .toBuffer();
    const { density } = await sharp(data).metadata();
    t.assert.strictEqual(600, density);
  });

  test('TIFF uses xres and yres over withMetadataDensity if explicitly provided', async (t) => {
    t.plan(1);
    const data = await sharp(fixtures.inputTiff)
      .resize(8, 8)
      .tiff({ xres: 1000, yres: 1000 })
      .withMetadata({ density: 600 })
      .toBuffer();
    const { density } = await sharp(data).metadata();
    t.assert.strictEqual(25400, density);
  });

  test('TIFF invalid xres value should throw an error', (t) => {
    t.plan(1);
    t.assert.throws(() => {
      sharp().tiff({ xres: '1000.0' });
    });
  });

  test('TIFF invalid yres value should throw an error', (t) => {
    t.plan(1);
    t.assert.throws(() => {
      sharp().tiff({ yres: '1000.0' });
    });
  });

  test('TIFF lzw compression with horizontal predictor shrinks test file', async (t) => {
    t.plan(3);
    const start = await fs.stat(fixtures.inputTiffUncompressed);
    const info = await sharp(fixtures.inputTiffUncompressed)
      .tiff({
        compression: 'lzw',
        predictor: 'horizontal'
      })
      .toFile(outputTiff);
    t.assert.strictEqual('tiff', info.format);
    t.assert.strictEqual(3, info.channels);
    t.assert.ok(info.size < start.size);
    await fs.rm(outputTiff);
  });

  test('TIFF LZW RGBA toFile', async (t) => {
    t.plan(1);
    const info = await sharp({
      create: {
        width: 1,
        height: 1,
        channels: 4,
        background: 'red'
      }
    })
      .tiff({
        compression: 'lzw'
      })
      .toFile(outputTiff);
    t.assert.strictEqual(4, info.channels);
  });

  test('TIFF LZW RGBA toBuffer', async (t) => {
    t.plan(1);
    const { info } = await sharp({
      create: {
        width: 1,
        height: 1,
        channels: 4,
        background: 'red'
      }
    })
      .tiff({
        compression: 'lzw'
      })
      .toBuffer({ resolveWithObject: true });
    t.assert.strictEqual(4, info.channels);
  });

  test('TIFF ccittfax4 compression shrinks b-w test file', async (t) => {
    t.plan(2);
    const start = await fs.stat(fixtures.inputTiff);
    const info = await sharp(fixtures.inputTiff)
      .toColourspace('b-w')
      .tiff({
        bitdepth: 1,
        compression: 'ccittfax4'
      })
      .toFile(outputTiff);
    t.assert.strictEqual('tiff', info.format);
    t.assert.ok(info.size < start.size);
    await fs.rm(outputTiff);
  });

  test('TIFF resolutionUnit of inch (default)', async (t) => {
    t.plan(1);
    const data = await sharp({ create: { width: 8, height: 8, channels: 3, background: 'red' } })
      .tiff()
      .toBuffer();
    const { resolutionUnit } = await sharp(data).metadata();
    t.assert.strictEqual(resolutionUnit, 'inch');
  });

  test('TIFF resolutionUnit of inch', async (t) => {
    t.plan(1);
    const data = await sharp({ create: { width: 8, height: 8, channels: 3, background: 'red' } })
      .tiff({ resolutionUnit: 'inch' })
      .toBuffer();
    const { resolutionUnit } = await sharp(data).metadata();
    t.assert.strictEqual(resolutionUnit, 'inch');
  });

  test('TIFF resolutionUnit of cm', async (t) => {
    t.plan(1);
    const data = await sharp({ create: { width: 8, height: 8, channels: 3, background: 'red' } })
      .tiff({ resolutionUnit: 'cm' })
      .toBuffer();
    const { resolutionUnit } = await sharp(data).metadata();
    t.assert.strictEqual(resolutionUnit, 'cm');
  });

  test('TIFF deflate compression with horizontal predictor shrinks test file', async (t) => {
    t.plan(2);
    const start = await fs.stat(fixtures.inputTiffUncompressed);
    const info = await sharp(fixtures.inputTiffUncompressed)
      .tiff({
        compression: 'deflate',
        predictor: 'horizontal'
      })
      .toFile(outputTiff);
    t.assert.strictEqual('tiff', info.format);
    t.assert.ok(info.size < start.size);
    await fs.rm(outputTiff);
  });

  test('TIFF deflate compression with float predictor shrinks test file', async (t) => {
    t.plan(2);
    const start = await fs.stat(fixtures.inputTiffUncompressed);
    const info = await sharp(fixtures.inputTiffUncompressed)
      .tiff({
        compression: 'deflate',
        predictor: 'float'
      })
      .toFile(outputTiff);
    t.assert.strictEqual('tiff', info.format);
    t.assert.ok(start.size > info.size);
    await fs.rm(outputTiff);
  });

  test('TIFF deflate compression without predictor shrinks test file', async (t) => {
    t.plan(2);
    const start = await fs.stat(fixtures.inputTiffUncompressed);
    const info = await sharp(fixtures.inputTiffUncompressed)
      .tiff({
        compression: 'deflate',
        predictor: 'none'
      })
      .toFile(outputTiff);
    t.assert.strictEqual('tiff', info.format);
    t.assert.ok(info.size < start.size);
    await fs.rm(outputTiff);
  });

  test('TIFF jpeg compression shrinks test file', async (t) => {
    t.plan(2);
    const start = await fs.stat(fixtures.inputTiffUncompressed);
    const info = await sharp(fixtures.inputTiffUncompressed)
      .tiff({
        compression: 'jpeg'
      })
      .toFile(outputTiff);
    t.assert.strictEqual('tiff', info.format);
    t.assert.ok(info.size < start.size);
    await fs.rm(outputTiff);
  });

  test('TIFF none compression does not throw error', (t) => {
    t.plan(1);
    t.assert.doesNotThrow(() => {
      sharp().tiff({ compression: 'none' });
    });
  });

  test('TIFF lzw compression does not throw error', (t) => {
    t.plan(1);
    t.assert.doesNotThrow(() => {
      sharp().tiff({ compression: 'lzw' });
    });
  });

  test('TIFF deflate compression does not throw error', (t) => {
    t.plan(1);
    t.assert.doesNotThrow(() => {
      sharp().tiff({ compression: 'deflate' });
    });
  });

  test('TIFF invalid compression option throws', (t) => {
    t.plan(1);
    t.assert.throws(() => {
      sharp().tiff({ compression: 0 });
    });
  });

  test('TIFF invalid compression option throws', (t) => {
    t.plan(1);
    t.assert.throws(() => {
      sharp().tiff({ compression: 'a' });
    });
  });

  test('TIFF bigtiff true value does not throw error', (t) => {
    t.plan(1);
    t.assert.doesNotThrow(() => {
      sharp().tiff({ bigtiff: true });
    });
  });

  test('Invalid TIFF bigtiff value throws error', (t) => {
    t.plan(1);
    t.assert.throws(() => {
      sharp().tiff({ bigtiff: 'true' });
    });
  });

  test('TIFF invalid predictor option throws', (t) => {
    t.plan(1);
    t.assert.throws(() => {
      sharp().tiff({ predictor: 'a' });
    });
  });

  test('TIFF invalid resolutionUnit option throws', (t) => {
    t.plan(1);
    t.assert.throws(() => {
      sharp().tiff({ resolutionUnit: 'none' });
    });
  });

  test('TIFF horizontal predictor does not throw error', (t) => {
    t.plan(1);
    t.assert.doesNotThrow(() => {
      sharp().tiff({ predictor: 'horizontal' });
    });
  });

  test('TIFF float predictor does not throw error', (t) => {
    t.plan(1);
    t.assert.doesNotThrow(() => {
      sharp().tiff({ predictor: 'float' });
    });
  });

  test('TIFF none predictor does not throw error', (t) => {
    t.plan(1);
    t.assert.doesNotThrow(() => {
      sharp().tiff({ predictor: 'none' });
    });
  });

  test('TIFF tiled pyramid image without compression enlarges test file', async (t) => {
    t.plan(2);
    const start = await fs.stat(fixtures.inputTiffUncompressed);
    const info = await sharp(fixtures.inputTiffUncompressed)
      .tiff({
        compression: 'none',
        pyramid: true,
        tile: true,
        tileHeight: 256,
        tileWidth: 256
      })
      .toFile(outputTiff);
    t.assert.strictEqual('tiff', info.format);
    t.assert.ok(info.size > start.size);
    await fs.rm(outputTiff);
  });

  test('TIFF pyramid true value does not throw error', (t) => {
    t.plan(1);
    t.assert.doesNotThrow(() => {
      sharp().tiff({ pyramid: true });
    });
  });

  test('Invalid TIFF pyramid value throws error', (t) => {
    t.plan(1);
    t.assert.throws(() => {
      sharp().tiff({ pyramid: 'true' });
    });
  });

  test('TIFF miniswhite true value does not throw error', (t) => {
    t.plan(1);
    t.assert.doesNotThrow(() => {
      sharp().tiff({ miniswhite: true });
    });
  });

  test('Invalid TIFF miniswhite value throws error', (t) => {
    t.plan(1);
    t.assert.throws(() => {
      sharp().tiff({ miniswhite: 'true' });
    });
  });

  test('Invalid TIFF tile value throws error', (t) => {
    t.plan(1);
    t.assert.throws(() => {
      sharp().tiff({ tile: 'true' });
    });
  });

  test('TIFF tile true value does not throw error', (t) => {
    t.plan(1);
    t.assert.doesNotThrow(() => {
      sharp().tiff({ tile: true });
    });
  });

  test('Valid TIFF tileHeight value does not throw error', (t) => {
    t.plan(1);
    t.assert.doesNotThrow(() => {
      sharp().tiff({ tileHeight: 512 });
    });
  });

  test('Valid TIFF tileWidth value does not throw error', (t) => {
    t.plan(1);
    t.assert.doesNotThrow(() => {
      sharp().tiff({ tileWidth: 512 });
    });
  });

  test('Invalid TIFF tileHeight value throws error', (t) => {
    t.plan(1);
    t.assert.throws(() => {
      sharp().tiff({ tileHeight: '256' });
    });
  });

  test('Invalid TIFF tileWidth value throws error', (t) => {
    t.plan(1);
    t.assert.throws(() => {
      sharp().tiff({ tileWidth: '256' });
    });
  });

  test('Invalid TIFF tileHeight value throws error', (t) => {
    t.plan(1);
    t.assert.throws(() => {
      sharp().tiff({ tileHeight: 0 });
    });
  });

  test('Invalid TIFF tileWidth value throws error', (t) => {
    t.plan(1);
    t.assert.throws(() => {
      sharp().tiff({ tileWidth: 0 });
    });
  });

  test('TIFF file input with invalid page fails gracefully', async (t) => {
    t.plan(1);
    await t.assert.rejects(sharp(fixtures.inputTiffMultipage, { page: 2 }).toBuffer());
  });

  test('TIFF buffer input with invalid page fails gracefully', async (t) => {
    t.plan(1);
    const inputTiffBuffer = await fs.readFile(fixtures.inputTiffMultipage);
    await t.assert.rejects(sharp(inputTiffBuffer, { page: 2 }).toBuffer());
  });
});
