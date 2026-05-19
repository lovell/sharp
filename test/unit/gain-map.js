/*!
  Copyright 2013 Lovell Fuller and others.
  SPDX-License-Identifier: Apache-2.0
*/

const { suite, test } = require('node:test');
const exifReader = require('exif-reader');

const sharp = require('../../');
const fixtures = require('../fixtures');

suite('Gain maps', () => {
  test('Metadata contains gainMap', async (t) => {
    t.plan(4);

    const { format, gainMap } = await sharp(
      fixtures.inputJpgWithGainMap,
    ).metadata();
    t.assert.strictEqual(format, 'jpeg');
    t.assert.strictEqual(typeof gainMap, 'object');
    t.assert.ok(Buffer.isBuffer(gainMap.image));
    t.assert.strictEqual(gainMap.image.length, 31738);
  });

  test('Can be regenerated', async (t) => {
    t.plan(4);

    const data = await sharp(fixtures.inputJpgWithGainMap)
      .withGainMap()
      .toBuffer();
    const metadata = await sharp(data).metadata();
    t.assert.strictEqual(metadata.format, 'jpeg');
    t.assert.strictEqual(typeof metadata.gainMap, 'object');
    t.assert.ok(Buffer.isBuffer(metadata.gainMap.image));

    const {
      format,
      width,
      height,
      channels,
      depth,
      space,
      hasProfile,
      chromaSubsampling,
    } = await sharp(metadata.gainMap.image).metadata();

    t.assert.deepEqual(
      {
        format,
        width,
        height,
        channels,
        depth,
        space,
        hasProfile,
        chromaSubsampling,
      },
      {
        format: 'jpeg',
        width: 1920,
        height: 1080,
        channels: 1,
        depth: 'uchar',
        space: 'b-w',
        hasProfile: true,
        chromaSubsampling: '4:4:4',
      },
    );
  });

  test('Buffer can be detached and reattached', async (t) => {
    t.plan(4);

    const data = await sharp(fixtures.inputJpgWithGainMap)
      .keepGainMap()
      .toBuffer();

    const metadata = await sharp(data).metadata();
    t.assert.strictEqual(metadata.format, 'jpeg');
    t.assert.strictEqual(typeof metadata.gainMap, 'object');
    t.assert.ok(Buffer.isBuffer(metadata.gainMap.image));

    const {
      format,
      width,
      height,
      channels,
      depth,
      space,
      hasProfile,
      chromaSubsampling,
    } = await sharp(metadata.gainMap.image).metadata();

    t.assert.deepEqual(
      {
        format,
        width,
        height,
        channels,
        depth,
        space,
        hasProfile,
        chromaSubsampling,
      },
      {
        format: 'jpeg',
        width: 960,
        height: 540,
        channels: 1,
        depth: 'uchar',
        space: 'b-w',
        hasProfile: false,
        chromaSubsampling: '4:4:4',
      },
    );
  });

  test('File can be detached and reattached', async (t) => {
    t.plan(4);

    const outputPath = fixtures.path('output-with-gain-map.jpg');
    await sharp(fixtures.inputJpgWithGainMap)
      .keepGainMap()
      .toFile(outputPath);

    const metadata = await sharp(outputPath).metadata();
    t.assert.strictEqual(metadata.format, 'jpeg');
    t.assert.strictEqual(typeof metadata.gainMap, 'object');
    t.assert.ok(Buffer.isBuffer(metadata.gainMap.image));

    const {
      format,
      width,
      height,
      channels,
      depth,
      space,
      hasProfile,
      chromaSubsampling,
    } = await sharp(metadata.gainMap.image).metadata();

    t.assert.deepEqual(
      {
        format,
        width,
        height,
        channels,
        depth,
        space,
        hasProfile,
        chromaSubsampling,
      },
      {
        format: 'jpeg',
        width: 960,
        height: 540,
        channels: 1,
        depth: 'uchar',
        space: 'b-w',
        hasProfile: false,
        chromaSubsampling: '4:4:4',
      },
    );
  });

  test('Can be detached, resized and reattached', async (t) => {
    t.plan(4);

    const data = await sharp(fixtures.inputJpgWithGainMap)
      .keepGainMap()
      .resize(32)
      .toBuffer();

    const metadata = await sharp(data).metadata();
    t.assert.strictEqual(metadata.format, 'jpeg');
    t.assert.strictEqual(typeof metadata.gainMap, 'object');
    t.assert.ok(Buffer.isBuffer(metadata.gainMap.image));

    const {
      format,
      width,
      height,
      channels,
      depth,
      space,
      hasProfile,
      chromaSubsampling,
    } = await sharp(metadata.gainMap.image).metadata();

    t.assert.deepEqual(
      {
        format,
        width,
        height,
        channels,
        depth,
        space,
        hasProfile,
        chromaSubsampling,
      },
      {
        format: 'jpeg',
        width: 8,
        height: 5,
        channels: 1,
        depth: 'uchar',
        space: 'b-w',
        hasProfile: false,
        chromaSubsampling: '4:4:4',
      },
    );
  });

  test('Cannot keep existing gain map with certain operations', async (t) => {
    t.plan(2);

    await t.assert.rejects(
      sharp(fixtures.inputJpgWithGainMap)
        .keepGainMap()
        .modulate({ hue: 180 })
        .toBuffer(),
      /Modulate is not supported when keeping gain maps/
    );

    await t.assert.rejects(
      sharp(fixtures.inputJpgWithGainMap)
        .keepGainMap()
        .convolve({
          width: 3,
          height: 3,
          kernel: [0, -1, 0, -1, 5, -1, 0, -1, 0]
        })
        .toBuffer(),
      /Convolve is not supported when keeping gain maps/
    );
  });

  test('other metadata can be retained when keeping gain map', async (t) => {
    t.plan(2);

    const input = fixtures.inputJpgWithGainMap;
    const data = await sharp(input)
      .keepGainMap()
      .keepMetadata()
      .resize(32)
      .toBuffer();

    const { exif, gainMap } = await sharp(data).metadata();
    const exifData = exifReader(exif);
    t.assert.strictEqual(exifData.Photo.PixelXDimension, 32);
    t.assert.ok(Buffer.isBuffer(gainMap.image));
  });
});
