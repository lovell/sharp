/*!
  Copyright 2013 Lovell Fuller and others.
  SPDX-License-Identifier: Apache-2.0
*/

const { suite, test } = require('node:test');

const sharp = require('../../');
const {
  inputAvif,
  inputAvifWithPitmBox,
  inputJpg,
  inputGifAnimated,
  inputPng,
} = require('../fixtures');

suite('AVIF', () => {
  test('called without options does not throw an error', (t) => {
    t.plan(1);
    t.assert.doesNotThrow(() => {
      sharp().avif();
    });
  });

  test('can convert AVIF to JPEG', async (t) => {
    t.plan(1);
    const data = await sharp(inputAvif).resize(32).jpeg().toBuffer();
    const { size, ...metadata } = await sharp(data).metadata();
    void size;
    t.assert.deepStrictEqual(metadata, {
      autoOrient: {
        height: 13,
        width: 32,
      },
      channels: 3,
      chromaSubsampling: '4:2:0',
      density: 72,
      depth: 'uchar',
      format: 'jpeg',
      mediaType: 'image/jpeg',
      hasAlpha: false,
      hasProfile: false,
      // 32 / (2048 / 858) = 13.40625
      // Math.round(13.40625) = 13
      height: 13,
      isProgressive: false,
      isPalette: false,
      space: 'srgb',
      width: 32,
    });
  });

  test('can convert JPEG to AVIF', async (t) => {
    t.plan(1);
    const data = await sharp(inputJpg)
      .resize(32)
      .avif({ effort: 0 })
      .toBuffer();
    const { size, ...metadata } = await sharp(data).metadata();
    void size;
    t.assert.deepStrictEqual(metadata, {
      autoOrient: {
        height: 26,
        width: 32,
      },
      channels: 3,
      compression: 'av1',
      depth: 'uchar',
      format: 'heif',
      mediaType: 'image/avif',
      hasAlpha: false,
      hasProfile: false,
      height: 26,
      isProgressive: false,
      isPalette: false,
      bitsPerSample: 8,
      pagePrimary: 0,
      pages: 1,
      space: 'srgb',
      width: 32,
    });
  });

  test('can convert PNG to lossless AVIF', async (t) => {
    t.plan(1);
    const data = await sharp(inputPng)
      .resize(32)
      .avif({ lossless: true, effort: 0 })
      .toBuffer();
    const { size, ...metadata } = await sharp(data).metadata();
    void size;
    t.assert.deepStrictEqual(metadata, {
      autoOrient: {
        height: 24,
        width: 32,
      },
      channels: 3,
      compression: 'av1',
      depth: 'uchar',
      format: 'heif',
      mediaType: 'image/avif',
      hasAlpha: false,
      hasProfile: false,
      height: 24,
      isProgressive: false,
      isPalette: false,
      bitsPerSample: 8,
      pagePrimary: 0,
      pages: 1,
      space: 'srgb',
      width: 32,
    });
  });

  test('can passthrough AVIF', async (t) => {
    t.plan(1);
    const data = await sharp(inputAvif).resize(32).toBuffer();
    const { size, ...metadata } = await sharp(data).metadata();
    void size;
    t.assert.deepStrictEqual(metadata, {
      autoOrient: {
        height: 13,
        width: 32,
      },
      channels: 3,
      compression: 'av1',
      depth: 'uchar',
      format: 'heif',
      mediaType: 'image/avif',
      hasAlpha: false,
      hasProfile: false,
      height: 13,
      isProgressive: false,
      isPalette: false,
      bitsPerSample: 8,
      pagePrimary: 0,
      pages: 1,
      space: 'srgb',
      width: 32,
    });
  });

  test('can convert animated GIF to non-animated AVIF', async (t) => {
    t.plan(1);
    const data = await sharp(inputGifAnimated, { animated: true })
      .resize(10)
      .avif({ effort: 0 })
      .toBuffer();
    const { size, ...metadata } = await sharp(data).metadata();
    void size;
    t.assert.deepStrictEqual(metadata, {
      autoOrient: {
        height: 300,
        width: 10,
      },
      channels: 4,
      compression: 'av1',
      depth: 'uchar',
      format: 'heif',
      mediaType: 'image/avif',
      hasAlpha: true,
      hasProfile: false,
      height: 300,
      isProgressive: false,
      isPalette: false,
      bitsPerSample: 8,
      pagePrimary: 0,
      pages: 1,
      space: 'srgb',
      width: 10,
    });
  });

  test('should cast to uchar', async (t) => {
    t.plan(1);
    const data = await sharp(inputJpg)
      .resize(32)
      .sharpen()
      .avif({ effort: 0 })
      .toBuffer();
    const { size, ...metadata } = await sharp(data).metadata();
    void size;
    t.assert.deepStrictEqual(metadata, {
      autoOrient: {
        height: 26,
        width: 32,
      },
      channels: 3,
      compression: 'av1',
      depth: 'uchar',
      format: 'heif',
      mediaType: 'image/avif',
      hasAlpha: false,
      hasProfile: false,
      height: 26,
      isProgressive: false,
      isPalette: false,
      bitsPerSample: 8,
      pagePrimary: 0,
      pages: 1,
      space: 'srgb',
      width: 32,
    });
  });

  test('Invalid width - too large', async (t) => {
    t.plan(1);
    await t.assert.rejects(
      () =>
        sharp({
          create: { width: 16385, height: 16, channels: 3, background: 'red' },
        })
          .avif()
          .toBuffer(),
      /Processed image is too large for the HEIF format/,
    );
  });

  test('Invalid height - too large', async (t) => {
    t.plan(1);
    await t.assert.rejects(
      () =>
        sharp({
          create: { width: 16, height: 16385, channels: 3, background: 'red' },
        })
          .avif()
          .toBuffer(),
      /Processed image is too large for the HEIF format/,
    );
  });

  test('Invalid bitdepth value throws error', (t) => {
    t.plan(1);
    t.assert.throws(
      () => sharp().avif({ bitdepth: 11 }),
      /Expected 8, 10 or 12 for bitdepth but received 11 of type number/,
    );
  });

  test('Different tune options result in different file sizes', async (t) => {
    t.plan(1);
    const ssim = await sharp(inputJpg)
      .resize(32)
      .avif({ tune: 'ssim', effort: 0 })
      .toBuffer();
    const iq = await sharp(inputJpg)
      .resize(32)
      .avif({ tune: 'iq', effort: 0 })
      .toBuffer();
    t.assert.ok(ssim.length > iq.length);
  });

  test('Auto tune defaults to iq for lossy', async (t) => {
    t.plan(1);
    const iq = await sharp(inputJpg)
      .resize(32)
      .avif({ tune: 'iq', effort: 0 })
      .toBuffer();
    const auto = await sharp(inputJpg)
      .resize(32)
      .avif({ tune: 'auto', effort: 0 })
      .toBuffer();
    t.assert.ok(auto.length === iq.length);
  });

  test('Auto tune defaults to ssim for lossless', async (t) => {
    t.plan(1);
    const ssim = await sharp(inputJpg)
      .resize(32)
      .avif({ tune: 'ssim', lossless: true, effort: 0 })
      .toBuffer();
    const auto = await sharp(inputJpg)
      .resize(32)
      .avif({ tune: 'auto', lossless: true, effort: 0 })
      .toBuffer();
    t.assert.ok(auto.length === ssim.length);
  });

  test('AVIF with non-zero primary item uses it as default page', async (t) => {
    t.plan(2);
    const { exif, ...metadata } = await sharp(inputAvifWithPitmBox).metadata();
    void exif;
    t.assert.deepStrictEqual(metadata, {
      format: 'heif',
      mediaType: 'image/avif',
      width: 4096,
      height: 800,
      space: 'srgb',
      channels: 3,
      depth: 'uchar',
      isProgressive: false,
      isPalette: false,
      bitsPerSample: 8,
      pages: 5,
      pagePrimary: 4,
      compression: 'av1',
      resolutionUnit: 'cm',
      hasProfile: false,
      hasAlpha: false,
      autoOrient: { width: 4096, height: 800 },
    });

    const data = await sharp(inputAvifWithPitmBox)
      .png({ compressionLevel: 0 })
      .toBuffer();
    const { size, ...pngMetadata } = await sharp(data).metadata();
    t.assert.deepStrictEqual(pngMetadata, {
      format: 'png',
      mediaType: 'image/png',
      width: 4096,
      height: 800,
      space: 'srgb',
      channels: 3,
      depth: 'uchar',
      isProgressive: false,
      isPalette: false,
      bitsPerSample: 8,
      hasProfile: false,
      hasAlpha: false,
      autoOrient: { width: 4096, height: 800 },
    });
  });
});
