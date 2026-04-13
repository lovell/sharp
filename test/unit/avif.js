/*!
  Copyright 2013 Lovell Fuller and others.
  SPDX-License-Identifier: Apache-2.0
*/

const { describe, it } = require('node:test');
const assert = require('node:assert');

const sharp = require('../../');
const {
  inputAvif,
  inputAvifWithPitmBox,
  inputJpg,
  inputGifAnimated,
  inputPng,
} = require('../fixtures');

describe('AVIF', () => {
  it('called without options does not throw an error', () => {
    assert.doesNotThrow(() => {
      sharp().avif();
    });
  });

  it('can convert AVIF to JPEG', async () => {
    const data = await sharp(inputAvif).resize(32).jpeg().toBuffer();
    const { size, ...metadata } = await sharp(data).metadata();
    void size;
    assert.deepStrictEqual(metadata, {
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

  it('can convert JPEG to AVIF', async () => {
    const data = await sharp(inputJpg)
      .resize(32)
      .avif({ effort: 0 })
      .toBuffer();
    const { size, ...metadata } = await sharp(data).metadata();
    void size;
    assert.deepStrictEqual(metadata, {
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

  it('can convert PNG to lossless AVIF', async () => {
    const data = await sharp(inputPng)
      .resize(32)
      .avif({ lossless: true, effort: 0 })
      .toBuffer();
    const { size, ...metadata } = await sharp(data).metadata();
    void size;
    assert.deepStrictEqual(metadata, {
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

  it('can passthrough AVIF', async () => {
    const data = await sharp(inputAvif).resize(32).toBuffer();
    const { size, ...metadata } = await sharp(data).metadata();
    void size;
    assert.deepStrictEqual(metadata, {
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

  it('can convert animated GIF to non-animated AVIF', async () => {
    const data = await sharp(inputGifAnimated, { animated: true })
      .resize(10)
      .avif({ effort: 0 })
      .toBuffer();
    const { size, ...metadata } = await sharp(data).metadata();
    void size;
    assert.deepStrictEqual(metadata, {
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

  it('should cast to uchar', async () => {
    const data = await sharp(inputJpg)
      .resize(32)
      .sharpen()
      .avif({ effort: 0 })
      .toBuffer();
    const { size, ...metadata } = await sharp(data).metadata();
    void size;
    assert.deepStrictEqual(metadata, {
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

  it('Invalid width - too large', async () =>
    assert.rejects(
      () =>
        sharp({
          create: { width: 16385, height: 16, channels: 3, background: 'red' },
        })
          .avif()
          .toBuffer(),
      /Processed image is too large for the HEIF format/,
    ));

  it('Invalid height - too large', async () =>
    assert.rejects(
      () =>
        sharp({
          create: { width: 16, height: 16385, channels: 3, background: 'red' },
        })
          .avif()
          .toBuffer(),
      /Processed image is too large for the HEIF format/,
    ));

  it('Invalid bitdepth value throws error', () =>
    assert.throws(
      () => sharp().avif({ bitdepth: 11 }),
      /Expected 8, 10 or 12 for bitdepth but received 11 of type number/,
    ));

  it('Different tune options result in different file sizes', async () => {
    const ssim = await sharp(inputJpg)
      .resize(32)
      .avif({ tune: 'ssim', effort: 0 })
      .toBuffer();
    const iq = await sharp(inputJpg)
      .resize(32)
      .avif({ tune: 'iq', effort: 0 })
      .toBuffer();
    assert(ssim.length < iq.length);
  });

  it('AVIF with non-zero primary item uses it as default page', async () => {
    const { exif, ...metadata } = await sharp(inputAvifWithPitmBox).metadata();
    void exif;
    assert.deepStrictEqual(metadata, {
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
    assert.deepStrictEqual(pngMetadata, {
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
