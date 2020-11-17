'use strict';

const assert = require('assert');

const sharp = require('../../');
const { inputAvif, inputJpg } = require('../fixtures');

describe('AVIF', () => {
  it('called without options does not throw an error', () => {
    assert.doesNotThrow(() => {
      sharp().avif();
    });
  });

  it('can passthrough AVIF', async () => {
    const data = await sharp(inputAvif)
      .resize(32)
      .toBuffer();
    const metadata = await sharp(data)
      .metadata();
    const { size, ...metadataWithoutSize } = metadata;
    assert.deepStrictEqual(metadataWithoutSize, {
      channels: 3,
      depth: 'uchar',
      format: 'heif',
      hasAlpha: false,
      hasProfile: false,
      height: 12,
      isProgressive: false,
      pageHeight: 12,
      pagePrimary: 0,
      pages: 1,
      space: 'srgb',
      width: 32
    });
  });

  it('can convert AVIF to JPEG', async () => {
    const data = await sharp(inputAvif)
      .resize(32)
      .jpeg()
      .toBuffer();
    const metadata = await sharp(data)
      .metadata();
    const { size, ...metadataWithoutSize } = metadata;
    assert.deepStrictEqual(metadataWithoutSize, {
      channels: 3,
      chromaSubsampling: '4:2:0',
      density: 72,
      depth: 'uchar',
      format: 'jpeg',
      hasAlpha: false,
      hasProfile: false,
      height: 13,
      isProgressive: false,
      space: 'srgb',
      width: 32
    });
  });

  it('can convert JPEG to AVIF', async () => {
    const data = await sharp(inputJpg)
      .resize(32)
      .avif()
      .toBuffer();
    const metadata = await sharp(data)
      .metadata();
    const { size, ...metadataWithoutSize } = metadata;
    assert.deepStrictEqual(metadataWithoutSize, {
      channels: 3,
      depth: 'uchar',
      format: 'heif',
      hasAlpha: false,
      hasProfile: false,
      height: 26,
      isProgressive: false,
      pageHeight: 26,
      pagePrimary: 0,
      pages: 1,
      space: 'srgb',
      width: 32
    });
  });
});
