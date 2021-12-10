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
      height: 14,
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
      height: 14,
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
});
