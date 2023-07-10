// Copyright 2013 Lovell Fuller and others.
// SPDX-License-Identifier: Apache-2.0

'use strict';

const assert = require('assert');

const sharp = require('../../');
const { inputAvif, inputJpg, inputGifAnimated } = require('../fixtures');

describe('AVIF', () => {
  it('called without options does not throw an error', () => {
    assert.doesNotThrow(() => {
      sharp().avif();
    });
  });

  it('can convert AVIF to JPEG', async () => {
    const data = await sharp(inputAvif)
      .resize(32)
      .jpeg()
      .toBuffer();
    const { size, ...metadata } = await sharp(data)
      .metadata();
    assert.deepStrictEqual(metadata, {
      channels: 3,
      chromaSubsampling: '4:2:0',
      density: 72,
      depth: 'uchar',
      format: 'jpeg',
      hasAlpha: false,
      hasProfile: false,
      // 32 / (2048 / 858) = 13.40625
      // Math.round(13.40625) = 13
      height: 13,
      isProgressive: false,
      space: 'srgb',
      width: 32
    });
  });

  it('can convert JPEG to AVIF', async () => {
    const data = await sharp(inputJpg)
      .resize(32)
      .avif({ effort: 0 })
      .toBuffer();
    const { size, ...metadata } = await sharp(data)
      .metadata();
    assert.deepStrictEqual(metadata, {
      channels: 3,
      compression: 'av1',
      depth: 'uchar',
      format: 'heif',
      hasAlpha: false,
      hasProfile: false,
      height: 26,
      isProgressive: false,
      pagePrimary: 0,
      pages: 1,
      space: 'srgb',
      width: 32
    });
  });

  it('can passthrough AVIF', async () => {
    const data = await sharp(inputAvif)
      .resize(32)
      .toBuffer();
    const { size, ...metadata } = await sharp(data)
      .metadata();
    assert.deepStrictEqual(metadata, {
      channels: 3,
      compression: 'av1',
      depth: 'uchar',
      format: 'heif',
      hasAlpha: false,
      hasProfile: false,
      height: 13,
      isProgressive: false,
      pagePrimary: 0,
      pages: 1,
      space: 'srgb',
      width: 32
    });
  });

  it('can convert animated GIF to non-animated AVIF', async () => {
    const data = await sharp(inputGifAnimated, { animated: true })
      .resize(10)
      .avif({ effort: 0 })
      .toBuffer();
    const { size, ...metadata } = await sharp(data)
      .metadata();
    assert.deepStrictEqual(metadata, {
      channels: 4,
      compression: 'av1',
      depth: 'uchar',
      format: 'heif',
      hasAlpha: true,
      hasProfile: false,
      height: 300,
      isProgressive: false,
      pagePrimary: 0,
      pages: 1,
      space: 'srgb',
      width: 10
    });
  });

  it('should cast to uchar', async () => {
    const data = await sharp(inputJpg)
      .resize(32)
      .sharpen()
      .avif({ effort: 0 })
      .toBuffer();
    const { size, ...metadata } = await sharp(data)
      .metadata();
    assert.deepStrictEqual(metadata, {
      channels: 3,
      compression: 'av1',
      depth: 'uchar',
      format: 'heif',
      hasAlpha: false,
      hasProfile: false,
      height: 26,
      isProgressive: false,
      pagePrimary: 0,
      pages: 1,
      space: 'srgb',
      width: 32
    });
  });

  it('Invalid width - too large', async () =>
    assert.rejects(
      () => sharp({ create: { width: 16385, height: 16, channels: 3, background: 'red' } }).avif().toBuffer(),
      /Processed image is too large for the HEIF format/
    )
  );

  it('Invalid height - too large', async () =>
    assert.rejects(
      () => sharp({ create: { width: 16, height: 16385, channels: 3, background: 'red' } }).avif().toBuffer(),
      /Processed image is too large for the HEIF format/
    )
  );
});
