/*!
  Copyright 2013 Lovell Fuller and others.
  SPDX-License-Identifier: Apache-2.0
*/

const fs = require('node:fs/promises');
const { suite, test } = require('node:test');

const exifReader = require('exif-reader');
const icc = require('icc');

const sharp = require('../../');
const fixtures = require('../fixtures');

const create = { width: 1, height: 1, channels: 3, background: 'red' };

const collect = (metadata, spec) => Object.fromEntries(Object.entries(spec).map(([key, selector]) => [
  key,
  typeof selector === 'function' ? selector(metadata) : metadata[selector]
]));

suite('Image metadata', () => {
  test('JPEG', async (t) => {
    t.plan(1);
    const metadata = await sharp(fixtures.inputJpg).metadata();
    t.assert.deepStrictEqual(collect(metadata, {
      format: 'format',
      mediaType: 'mediaType',
      sizeType: (value) => typeof value.size,
      width: 'width',
      height: 'height',
      space: 'space',
      channels: 'channels',
      depth: 'depth',
      densityType: (value) => typeof value.density,
      chromaSubsampling: 'chromaSubsampling',
      isProgressive: 'isProgressive',
      hasProfile: 'hasProfile',
      hasAlpha: 'hasAlpha',
      orientationType: (value) => typeof value.orientation,
      exifType: (value) => typeof value.exif,
      iccType: (value) => typeof value.icc
    }), {
      format: 'jpeg',
      mediaType: 'image/jpeg',
      sizeType: 'undefined',
      width: 2725,
      height: 2225,
      space: 'srgb',
      channels: 3,
      depth: 'uchar',
      densityType: 'number',
      chromaSubsampling: '4:2:0',
      isProgressive: false,
      hasProfile: false,
      hasAlpha: false,
      orientationType: 'undefined',
      exifType: 'undefined',
      iccType: 'undefined'
    });
  });

  test('JPEG with EXIF/ICC', async (t) => {
    t.plan(1);
    const metadata = await sharp(fixtures.inputJpgWithExif).metadata();
    t.assert.deepStrictEqual(collect(metadata, {
      format: 'format',
      mediaType: 'mediaType',
      sizeType: (value) => typeof value.size,
      width: 'width',
      height: 'height',
      space: 'space',
      channels: 'channels',
      depth: 'depth',
      density: 'density',
      chromaSubsampling: 'chromaSubsampling',
      isProgressive: 'isProgressive',
      hasProfile: 'hasProfile',
      hasAlpha: 'hasAlpha',
      orientation: 'orientation',
      exifType: (value) => typeof value.exif,
      exifBuffer: (value) => Buffer.isBuffer(value.exif),
      exifImageType: (value) => typeof exifReader(value.exif).Image,
      exifResolutionType: (value) => typeof exifReader(value.exif).Image.XResolution,
      iccType: (value) => typeof value.icc,
      iccBuffer: (value) => Buffer.isBuffer(value.icc),
      iccDescription: (value) => icc.parse(value.icc).description
    }), {
      format: 'jpeg',
      mediaType: 'image/jpeg',
      sizeType: 'undefined',
      width: 450,
      height: 600,
      space: 'srgb',
      channels: 3,
      depth: 'uchar',
      density: 72,
      chromaSubsampling: '4:2:0',
      isProgressive: false,
      hasProfile: true,
      hasAlpha: false,
      orientation: 8,
      exifType: 'object',
      exifBuffer: true,
      exifImageType: 'object',
      exifResolutionType: 'number',
      iccType: 'object',
      iccBuffer: true,
      iccDescription: 'Generic RGB Profile'
    });
  });

  test('JPEG with IPTC/XMP', async (t) => {
    t.plan(1);
    const metadata = await sharp(fixtures.inputJpgWithIptcAndXmp).metadata();
    t.assert.deepStrictEqual(collect(metadata, {
      iptcType: (value) => typeof value.iptc,
      iptcBuffer: (value) => Buffer.isBuffer(value.iptc),
      iptcLength: (value) => value.iptc.byteLength,
      iptcStart: (value) => value.iptc.indexOf(Buffer.from('Photoshop')),
      xmpType: (value) => typeof value.xmp,
      xmpBuffer: (value) => Buffer.isBuffer(value.xmp),
      xmpLength: (value) => value.xmp.byteLength,
      xmpStart: (value) => value.xmp.indexOf(Buffer.from('<?xpacket begin="')),
      xmpStringStarts: (value) => value.xmpAsString.startsWith('<?xpacket begin="﻿" id="W5M0MpCehiHzreSzNTczkc9d"?>')
    }), {
      iptcType: 'object',
      iptcBuffer: true,
      iptcLength: 18250,
      iptcStart: 0,
      xmpType: 'object',
      xmpBuffer: true,
      xmpLength: 12466,
      xmpStart: 0,
      xmpStringStarts: true
    });
  });

  test('TIFF', async (t) => {
    t.plan(1);
    const metadata = await sharp(fixtures.inputTiff).metadata();
    t.assert.deepStrictEqual(collect(metadata, {
      format: 'format',
      mediaType: 'mediaType',
      sizeType: (value) => typeof value.size,
      width: 'width',
      height: 'height',
      space: 'space',
      channels: 'channels',
      depth: 'depth',
      density: 'density',
      chromaSubsamplingType: (value) => typeof value.chromaSubsampling,
      isProgressive: 'isProgressive',
      hasProfile: 'hasProfile',
      hasAlpha: 'hasAlpha',
      orientation: 'orientation',
      autoOrientWidth: (value) => value.autoOrient.width,
      autoOrientHeight: (value) => value.autoOrient.height,
      exifType: (value) => typeof value.exif,
      iccType: (value) => typeof value.icc,
      xmpType: (value) => typeof value.xmp,
      xmpAsStringType: (value) => typeof value.xmpAsString,
      resolutionUnit: 'resolutionUnit'
    }), {
      format: 'tiff',
      mediaType: 'image/tiff',
      sizeType: 'undefined',
      width: 2464,
      height: 3248,
      space: 'b-w',
      channels: 1,
      depth: 'uchar',
      density: 300,
      chromaSubsamplingType: 'undefined',
      isProgressive: false,
      hasProfile: false,
      hasAlpha: false,
      orientation: 1,
      autoOrientWidth: 2464,
      autoOrientHeight: 3248,
      exifType: 'undefined',
      iccType: 'undefined',
      xmpType: 'undefined',
      xmpAsStringType: 'undefined',
      resolutionUnit: 'inch'
    });
  });

  test('Multipage TIFF', async (t) => {
    t.plan(1);
    const metadata = await sharp(fixtures.inputTiffMultipage).metadata();
    t.assert.deepStrictEqual(collect(metadata, {
      format: 'format',
      mediaType: 'mediaType',
      sizeType: (value) => typeof value.size,
      width: 'width',
      height: 'height',
      space: 'space',
      channels: 'channels',
      depth: 'depth',
      density: 'density',
      chromaSubsamplingType: (value) => typeof value.chromaSubsampling,
      isProgressive: 'isProgressive',
      pages: 'pages',
      hasProfile: 'hasProfile',
      hasAlpha: 'hasAlpha',
      orientation: 'orientation',
      exifType: (value) => typeof value.exif,
      iccType: (value) => typeof value.icc
    }), {
      format: 'tiff',
      mediaType: 'image/tiff',
      sizeType: 'undefined',
      width: 2464,
      height: 3248,
      space: 'b-w',
      channels: 1,
      depth: 'uchar',
      density: 300,
      chromaSubsamplingType: 'undefined',
      isProgressive: false,
      pages: 2,
      hasProfile: false,
      hasAlpha: false,
      orientation: 1,
      exifType: 'undefined',
      iccType: 'undefined'
    });
  });

  test('PNG', async (t) => {
    t.plan(1);
    const metadata = await sharp(fixtures.inputPng).metadata();
    t.assert.deepStrictEqual(collect(metadata, {
      format: 'format',
      mediaType: 'mediaType',
      sizeType: (value) => typeof value.size,
      width: 'width',
      height: 'height',
      space: 'space',
      channels: 'channels',
      depth: 'depth',
      density: 'density',
      chromaSubsamplingType: (value) => typeof value.chromaSubsampling,
      isProgressive: 'isProgressive',
      hasProfile: 'hasProfile',
      hasAlpha: 'hasAlpha',
      orientationType: (value) => typeof value.orientation,
      autoOrientWidth: (value) => value.autoOrient.width,
      autoOrientHeight: (value) => value.autoOrient.height,
      exifType: (value) => typeof value.exif,
      iccType: (value) => typeof value.icc
    }), {
      format: 'png',
      mediaType: 'image/png',
      sizeType: 'undefined',
      width: 2809,
      height: 2074,
      space: 'b-w',
      channels: 1,
      depth: 'uchar',
      density: 300,
      chromaSubsamplingType: 'undefined',
      isProgressive: false,
      hasProfile: false,
      hasAlpha: false,
      orientationType: 'undefined',
      autoOrientWidth: 2809,
      autoOrientHeight: 2074,
      exifType: 'undefined',
      iccType: 'undefined'
    });
  });

  test('PNG with comment', async (t) => {
    t.plan(1);
    const metadata = await sharp(fixtures.inputPngTestJoinChannel).metadata();
    t.assert.deepStrictEqual(collect(metadata, {
      format: 'format',
      mediaType: 'mediaType',
      sizeType: (value) => typeof value.size,
      width: 'width',
      height: 'height',
      space: 'space',
      channels: 'channels',
      depth: 'depth',
      density: 'density',
      chromaSubsamplingType: (value) => typeof value.chromaSubsampling,
      isProgressive: 'isProgressive',
      hasProfile: 'hasProfile',
      hasAlpha: 'hasAlpha',
      orientationType: (value) => typeof value.orientation,
      exifType: (value) => typeof value.exif,
      iccType: (value) => typeof value.icc,
      commentsLength: (value) => value.comments.length,
      commentsKeyword: (value) => value.comments[0].keyword,
      commentsText: (value) => value.comments[0].text
    }), {
      format: 'png',
      mediaType: 'image/png',
      sizeType: 'undefined',
      width: 320,
      height: 240,
      space: 'b-w',
      channels: 1,
      depth: 'uchar',
      density: 72,
      chromaSubsamplingType: 'undefined',
      isProgressive: false,
      hasProfile: false,
      hasAlpha: false,
      orientationType: 'undefined',
      exifType: 'undefined',
      iccType: 'undefined',
      commentsLength: 1,
      commentsKeyword: 'Comment',
      commentsText: 'Created with GIMP'
    });
  });

  test('Transparent PNG', async (t) => {
    t.plan(1);
    const metadata = await sharp(fixtures.inputPngWithTransparency).metadata();
    t.assert.deepStrictEqual(collect(metadata, {
      format: 'format',
      mediaType: 'mediaType',
      sizeType: (value) => typeof value.size,
      width: 'width',
      height: 'height',
      space: 'space',
      channels: 'channels',
      depth: 'depth',
      density: 'density',
      chromaSubsamplingType: (value) => typeof value.chromaSubsampling,
      isProgressive: 'isProgressive',
      hasProfile: 'hasProfile',
      hasAlpha: 'hasAlpha',
      orientationType: (value) => typeof value.orientation,
      exifType: (value) => typeof value.exif,
      iccType: (value) => typeof value.icc
    }), {
      format: 'png',
      mediaType: 'image/png',
      sizeType: 'undefined',
      width: 2048,
      height: 1536,
      space: 'srgb',
      channels: 4,
      depth: 'uchar',
      density: 72,
      chromaSubsamplingType: 'undefined',
      isProgressive: false,
      hasProfile: false,
      hasAlpha: true,
      orientationType: 'undefined',
      exifType: 'undefined',
      iccType: 'undefined'
    });
  });

  test('PNG with greyscale bKGD chunk - 8 bit', async (t) => {
    t.plan(1);
    const metadata = await sharp(fixtures.inputPng8BitGreyBackground).metadata();
    t.assert.deepStrictEqual(collect(metadata, {
      background: 'background',
      bitsPerSample: 'bitsPerSample',
      channels: 'channels',
      density: 'density',
      depth: 'depth',
      format: 'format',
      hasAlpha: 'hasAlpha',
      hasProfile: 'hasProfile',
      height: 'height',
      isPalette: 'isPalette',
      isProgressive: 'isProgressive',
      mediaType: 'mediaType',
      space: 'space',
      width: 'width',
      autoOrient: 'autoOrient'
    }), {
      background: { gray: 0 },
      bitsPerSample: 8,
      channels: 2,
      density: 72,
      depth: 'uchar',
      format: 'png',
      hasAlpha: true,
      hasProfile: false,
      height: 32,
      isPalette: false,
      isProgressive: false,
      mediaType: 'image/png',
      space: 'b-w',
      width: 32,
      autoOrient: { width: 32, height: 32 }
    });
  });

  test('PNG with greyscale bKGD chunk - 16 bit', async (t) => {
    t.plan(1);
    const metadata = await sharp(fixtures.inputPng16BitGreyBackground).metadata();
    t.assert.deepStrictEqual(collect(metadata, {
      background: 'background',
      bitsPerSample: 'bitsPerSample',
      channels: 'channels',
      density: 'density',
      depth: 'depth',
      format: 'format',
      hasAlpha: 'hasAlpha',
      hasProfile: 'hasProfile',
      height: 'height',
      isPalette: 'isPalette',
      isProgressive: 'isProgressive',
      mediaType: 'mediaType',
      space: 'space',
      width: 'width',
      autoOrient: 'autoOrient'
    }), {
      background: { gray: 67 },
      bitsPerSample: 16,
      channels: 2,
      density: 72,
      depth: 'ushort',
      format: 'png',
      hasAlpha: true,
      hasProfile: false,
      height: 32,
      isPalette: false,
      isProgressive: false,
      mediaType: 'image/png',
      space: 'grey16',
      width: 32,
      autoOrient: { width: 32, height: 32 }
    });
  });

  test('WebP', async (t) => {
    t.plan(1);
    const metadata = await sharp(fixtures.inputWebP).metadata();
    t.assert.deepStrictEqual(collect(metadata, {
      format: 'format',
      mediaType: 'mediaType',
      sizeType: (value) => typeof value.size,
      width: 'width',
      height: 'height',
      space: 'space',
      channels: 'channels',
      depth: 'depth',
      densityType: (value) => typeof value.density,
      chromaSubsamplingType: (value) => typeof value.chromaSubsampling,
      isProgressive: 'isProgressive',
      hasProfile: 'hasProfile',
      hasAlpha: 'hasAlpha',
      orientationType: (value) => typeof value.orientation,
      exifType: (value) => typeof value.exif,
      iccType: (value) => typeof value.icc
    }), {
      format: 'webp',
      mediaType: 'image/webp',
      sizeType: 'undefined',
      width: 1024,
      height: 772,
      space: 'srgb',
      channels: 3,
      depth: 'uchar',
      densityType: 'undefined',
      chromaSubsamplingType: 'undefined',
      isProgressive: false,
      hasProfile: false,
      hasAlpha: false,
      orientationType: 'undefined',
      exifType: 'undefined',
      iccType: 'undefined'
    });
  });

  test('Animated WebP', async (t) => {
    t.plan(1);
    const metadata = await sharp(fixtures.inputWebPAnimated).metadata();
    t.assert.deepStrictEqual(collect(metadata, {
      format: 'format',
      mediaType: 'mediaType',
      width: 'width',
      height: 'height',
      space: 'space',
      channels: 'channels',
      depth: 'depth',
      isProgressive: 'isProgressive',
      pages: 'pages',
      loop: 'loop',
      delay: 'delay',
      hasProfile: 'hasProfile',
      hasAlpha: 'hasAlpha'
    }), {
      format: 'webp',
      mediaType: 'image/webp',
      width: 80,
      height: 80,
      space: 'srgb',
      channels: 4,
      depth: 'uchar',
      isProgressive: false,
      pages: 9,
      loop: 0,
      delay: [120, 120, 90, 120, 120, 90, 120, 90, 30],
      hasProfile: false,
      hasAlpha: true
    });
  });

  test('Animated WebP with all pages', async (t) => {
    t.plan(1);
    const metadata = await sharp(fixtures.inputWebPAnimated, { pages: -1 }).metadata();
    t.assert.deepStrictEqual(collect(metadata, {
      format: 'format',
      mediaType: 'mediaType',
      width: 'width',
      height: 'height',
      space: 'space',
      channels: 'channels',
      depth: 'depth',
      isProgressive: 'isProgressive',
      pages: 'pages',
      pageHeight: 'pageHeight',
      loop: 'loop',
      delay: 'delay',
      hasProfile: 'hasProfile',
      hasAlpha: 'hasAlpha'
    }), {
      format: 'webp',
      mediaType: 'image/webp',
      width: 80,
      height: 720,
      space: 'srgb',
      channels: 4,
      depth: 'uchar',
      isProgressive: false,
      pages: 9,
      pageHeight: 80,
      loop: 0,
      delay: [120, 120, 90, 120, 120, 90, 120, 90, 30],
      hasProfile: false,
      hasAlpha: true
    });
  });

  test('Animated WebP with limited looping', async (t) => {
    t.plan(1);
    const metadata = await sharp(fixtures.inputWebPAnimatedLoop3).metadata();
    t.assert.deepStrictEqual(collect(metadata, {
      format: 'format',
      mediaType: 'mediaType',
      width: 'width',
      height: 'height',
      space: 'space',
      channels: 'channels',
      depth: 'depth',
      isProgressive: 'isProgressive',
      pages: 'pages',
      loop: 'loop',
      delay: 'delay',
      hasProfile: 'hasProfile',
      hasAlpha: 'hasAlpha'
    }), {
      format: 'webp',
      mediaType: 'image/webp',
      width: 370,
      height: 285,
      space: 'srgb',
      channels: 4,
      depth: 'uchar',
      isProgressive: false,
      pages: 10,
      loop: 3,
      delay: [...Array(9).fill(3000), 15000],
      hasProfile: false,
      hasAlpha: true
    });
  });

  test('GIF', async (t) => {
    t.plan(1);
    const metadata = await sharp(fixtures.inputGif).metadata();
    t.assert.deepStrictEqual(collect(metadata, {
      format: 'format',
      mediaType: 'mediaType',
      sizeType: (value) => typeof value.size,
      width: 'width',
      height: 'height',
      channels: 'channels',
      depth: 'depth',
      densityType: (value) => typeof value.density,
      chromaSubsamplingType: (value) => typeof value.chromaSubsampling,
      isProgressive: 'isProgressive',
      hasProfile: 'hasProfile',
      orientationType: (value) => typeof value.orientation,
      exifType: (value) => typeof value.exif,
      iccType: (value) => typeof value.icc,
      background: 'background'
    }), {
      format: 'gif',
      mediaType: 'image/gif',
      sizeType: 'undefined',
      width: 800,
      height: 533,
      channels: 3,
      depth: 'uchar',
      densityType: 'undefined',
      chromaSubsamplingType: 'undefined',
      isProgressive: false,
      hasProfile: false,
      orientationType: 'undefined',
      exifType: 'undefined',
      iccType: 'undefined',
      background: { r: 138, g: 148, b: 102 }
    });
  });

  test('GIF grey+alpha', async (t) => {
    t.plan(1);
    const metadata = await sharp(fixtures.inputGifGreyPlusAlpha).metadata();
    t.assert.deepStrictEqual(collect(metadata, {
      format: 'format',
      mediaType: 'mediaType',
      sizeType: (value) => typeof value.size,
      width: 'width',
      height: 'height',
      channels: 'channels',
      depth: 'depth',
      densityType: (value) => typeof value.density,
      chromaSubsamplingType: (value) => typeof value.chromaSubsampling,
      isProgressive: 'isProgressive',
      hasProfile: 'hasProfile',
      orientationType: (value) => typeof value.orientation,
      exifType: (value) => typeof value.exif,
      iccType: (value) => typeof value.icc
    }), {
      format: 'gif',
      mediaType: 'image/gif',
      sizeType: 'undefined',
      width: 2,
      height: 1,
      channels: 4,
      depth: 'uchar',
      densityType: 'undefined',
      chromaSubsamplingType: 'undefined',
      isProgressive: false,
      hasProfile: false,
      orientationType: 'undefined',
      exifType: 'undefined',
      iccType: 'undefined'
    });
  });

  test('Animated GIF', async (t) => {
    t.plan(1);
    const metadata = await sharp(fixtures.inputGifAnimated).metadata();
    t.assert.deepStrictEqual(collect(metadata, {
      format: 'format',
      mediaType: 'mediaType',
      width: 'width',
      height: 'height',
      space: 'space',
      channels: 'channels',
      depth: 'depth',
      isProgressive: 'isProgressive',
      pages: 'pages',
      loop: 'loop',
      delay: 'delay',
      background: 'background',
      hasProfile: 'hasProfile',
      hasAlpha: 'hasAlpha'
    }), {
      format: 'gif',
      mediaType: 'image/gif',
      width: 80,
      height: 80,
      space: 'srgb',
      channels: 4,
      depth: 'uchar',
      isProgressive: false,
      pages: 30,
      loop: 0,
      delay: Array(30).fill(30),
      background: { r: 0, g: 0, b: 0 },
      hasProfile: false,
      hasAlpha: true
    });
  });

  test('Animated GIF with limited looping', async (t) => {
    t.plan(1);
    const metadata = await sharp(fixtures.inputGifAnimatedLoop3).metadata();
    t.assert.deepStrictEqual(collect(metadata, {
      format: 'format',
      mediaType: 'mediaType',
      width: 'width',
      height: 'height',
      space: 'space',
      channels: 'channels',
      depth: 'depth',
      isProgressive: 'isProgressive',
      pages: 'pages',
      loop: 'loop',
      delay: 'delay',
      hasProfile: 'hasProfile',
      hasAlpha: 'hasAlpha'
    }), {
      format: 'gif',
      mediaType: 'image/gif',
      width: 370,
      height: 285,
      space: 'srgb',
      channels: 4,
      depth: 'uchar',
      isProgressive: false,
      pages: 10,
      loop: 3,
      delay: [...Array(9).fill(3000), 15000],
      hasProfile: false,
      hasAlpha: true
    });
  });

  test('vips', async (t) => {
    t.plan(1);
    const metadata = await sharp(fixtures.inputV).metadata();
    t.assert.deepStrictEqual(collect(metadata, {
      format: 'format',
      sizeType: (value) => typeof value.size,
      width: 'width',
      height: 'height',
      channels: 'channels',
      depth: 'depth',
      density: 'density',
      chromaSubsamplingType: (value) => typeof value.chromaSubsampling,
      isProgressive: 'isProgressive',
      hasProfile: 'hasProfile',
      hasAlpha: 'hasAlpha',
      orientationType: (value) => typeof value.orientation,
      exifType: (value) => typeof value.exif,
      iccType: (value) => typeof value.icc
    }), {
      format: 'vips',
      sizeType: 'undefined',
      width: 70,
      height: 60,
      channels: 3,
      depth: 'uchar',
      density: 72,
      chromaSubsamplingType: 'undefined',
      isProgressive: false,
      hasProfile: false,
      hasAlpha: false,
      orientationType: 'undefined',
      exifType: 'undefined',
      iccType: 'undefined'
    });
  });

  test('File in, Promise out', async (t) => {
    t.plan(1);
    const metadata = await sharp(fixtures.inputJpg).metadata();
    t.assert.deepStrictEqual(collect(metadata, {
      format: 'format',
      mediaType: 'mediaType',
      sizeType: (value) => typeof value.size,
      width: 'width',
      height: 'height',
      space: 'space',
      channels: 'channels',
      depth: 'depth',
      densityType: (value) => typeof value.density,
      chromaSubsampling: 'chromaSubsampling',
      isProgressive: 'isProgressive',
      hasProfile: 'hasProfile',
      hasAlpha: 'hasAlpha',
      orientationType: (value) => typeof value.orientation,
      exifType: (value) => typeof value.exif,
      iccType: (value) => typeof value.icc
    }), {
      format: 'jpeg',
      mediaType: 'image/jpeg',
      sizeType: 'undefined',
      width: 2725,
      height: 2225,
      space: 'srgb',
      channels: 3,
      depth: 'uchar',
      densityType: 'number',
      chromaSubsampling: '4:2:0',
      isProgressive: false,
      hasProfile: false,
      hasAlpha: false,
      orientationType: 'undefined',
      exifType: 'undefined',
      iccType: 'undefined'
    });
  });

  test('Non-existent file in, Promise out', async (t) => {
    t.plan(1);
    await t.assert.rejects(() => sharp('fail').metadata(), /Input file is missing: fail/);
  });

  test('Invalid stream in, callback out', async (t) => {
    t.plan(1);
    const fd = await fs.open(__filename);
    const readable = fd.createReadStream();
    await t.assert.rejects(() => new Promise((resolve, reject) => {
      readable.pipe(
        sharp().metadata((err) => {
          if (err) {
            reject(err);
            return;
          }
          resolve();
        })
      );
    }), /Input buffer contains unsupported image format/);
  });

  test('Stream in, Promise out', async (t) => {
    t.plan(1);
    const fd = await fs.open(fixtures.inputJpg);
    const readable = fd.createReadStream();
    const pipeline = sharp();
    readable.pipe(pipeline);
    const metadata = await pipeline.metadata();
    t.assert.deepStrictEqual(collect(metadata, {
      format: 'format',
      mediaType: 'mediaType',
      size: 'size',
      width: 'width',
      height: 'height',
      space: 'space',
      channels: 'channels',
      depth: 'depth',
      densityType: (value) => typeof value.density,
      chromaSubsampling: 'chromaSubsampling',
      isProgressive: 'isProgressive',
      hasProfile: 'hasProfile',
      hasAlpha: 'hasAlpha',
      orientationType: (value) => typeof value.orientation,
      exifType: (value) => typeof value.exif,
      iccType: (value) => typeof value.icc
    }), {
      format: 'jpeg',
      mediaType: 'image/jpeg',
      size: 829183,
      width: 2725,
      height: 2225,
      space: 'srgb',
      channels: 3,
      depth: 'uchar',
      densityType: 'number',
      chromaSubsampling: '4:2:0',
      isProgressive: false,
      hasProfile: false,
      hasAlpha: false,
      orientationType: 'undefined',
      exifType: 'undefined',
      iccType: 'undefined'
    });
  });

  test('Stream in, rejected Promise out', async (t) => {
    t.plan(1);
    const fd = await fs.open(__filename);
    const readable = fd.createReadStream();
    const pipeline = sharp();
    readable.pipe(pipeline);
    await t.assert.rejects(() => pipeline.metadata(), /Input buffer contains unsupported image format/);
  });

  test('Stream in, finish event fires before metadata is requested', async (t) => {
    t.plan(1);
    const createImage = { width: 1, height: 1, channels: 3, background: 'red' };
    const image1 = sharp({ create: createImage }).png().pipe(sharp());
    const image2 = sharp({ create: createImage }).png().pipe(sharp());
    await new Promise((resolve) => setTimeout(resolve, 500));
    const data1 = await image1.metadata();
    const data2 = await image2.metadata();
    t.assert.deepStrictEqual([data1.format, data2.format], ['png', 'png']);
  });

  test('Stream', async (t) => {
    t.plan(1);
    const fd = await fs.open(fixtures.inputJpg);
    const readable = fd.createReadStream();
    const pipeline = sharp();
    const promise = pipeline.metadata();
    readable.pipe(pipeline);
    const metadata = await promise;
    t.assert.deepStrictEqual(collect(metadata, {
      format: 'format',
      mediaType: 'mediaType',
      size: 'size',
      width: 'width',
      height: 'height',
      space: 'space',
      channels: 'channels',
      depth: 'depth',
      densityType: (value) => typeof value.density,
      chromaSubsampling: 'chromaSubsampling',
      isProgressive: 'isProgressive',
      hasProfile: 'hasProfile',
      hasAlpha: 'hasAlpha',
      orientationType: (value) => typeof value.orientation,
      exifType: (value) => typeof value.exif,
      iccType: (value) => typeof value.icc
    }), {
      format: 'jpeg',
      mediaType: 'image/jpeg',
      size: 829183,
      width: 2725,
      height: 2225,
      space: 'srgb',
      channels: 3,
      depth: 'uchar',
      densityType: 'number',
      chromaSubsampling: '4:2:0',
      isProgressive: false,
      hasProfile: false,
      hasAlpha: false,
      orientationType: 'undefined',
      exifType: 'undefined',
      iccType: 'undefined'
    });
  });

  test('Resize to half width using metadata', async (t) => {
    t.plan(1);
    const image = sharp(fixtures.inputJpg);
    const metadata = await image.metadata();
    const resized = await image.resize(Math.floor(metadata.width / 2)).toBuffer({ resolveWithObject: true });
    t.assert.deepStrictEqual({
      metadataWidth: metadata.width,
      metadataHeight: metadata.height,
      resizedWidth: resized.info.width,
      resizedHeight: resized.info.height,
      resizedHasData: resized.data.length > 0
    }, {
      metadataWidth: 2725,
      metadataHeight: 2225,
      resizedWidth: 1362,
      resizedHeight: 1112,
      resizedHasData: true
    });
  });

  test('Keep EXIF metadata and add sRGB profile after a resize', async (t) => {
    t.plan(1);
    const buffer = await sharp(fixtures.inputJpgWithExif)
      .resize(320, 240)
      .withMetadata()
      .toBuffer();
    const metadata = await sharp(buffer).metadata();
    t.assert.deepStrictEqual(collect(metadata, {
      hasProfile: 'hasProfile',
      orientation: 'orientation',
      width: 'width',
      height: 'height',
      autoOrientWidth: (value) => value.autoOrient.width,
      autoOrientHeight: (value) => value.autoOrient.height,
      exifType: (value) => typeof value.exif,
      exifBuffer: (value) => Buffer.isBuffer(value.exif),
      exifResolutionType: (value) => typeof exifReader(value.exif).Image.XResolution,
      iccType: (value) => typeof value.icc,
      iccBuffer: (value) => Buffer.isBuffer(value.icc),
      iccColorSpace: (value) => icc.parse(value.icc).colorSpace,
      iccIntent: (value) => icc.parse(value.icc).intent,
      iccDeviceClass: (value) => icc.parse(value.icc).deviceClass
    }), {
      hasProfile: true,
      orientation: 8,
      width: 320,
      height: 240,
      autoOrientWidth: 240,
      autoOrientHeight: 320,
      exifType: 'object',
      exifBuffer: true,
      exifResolutionType: 'number',
      iccType: 'object',
      iccBuffer: true,
      iccColorSpace: 'RGB',
      iccIntent: 'Perceptual',
      iccDeviceClass: 'Monitor'
    });
  });

  test('keep existing ICC profile', async (t) => {
    t.plan(1);
    const data = await sharp(fixtures.inputJpgWithExif).keepIccProfile().toBuffer();
    const metadata = await sharp(data).metadata();
    t.assert.strictEqual(icc.parse(metadata.icc).description, 'Generic RGB Profile');
  });

  test('keep existing CMYK input profile for CMYK output', async (t) => {
    t.plan(1);
    const data = await sharp(fixtures.inputJpgWithCmykProfile)
      .keepIccProfile()
      .toColourspace('cmyk')
      .toBuffer();
    const metadata = await sharp(data).metadata();
    t.assert.deepStrictEqual({ channels: metadata.channels, description: icc.parse(metadata.icc).description }, {
      channels: 4,
      description: 'U.S. Web Coated (SWOP) v2'
    });
  });

  test('transform with but discard existing RGB input profile for CMYK output', async (t) => {
    t.plan(1);
    const data = await sharp(fixtures.inputJpgWithExif)
      .keepIccProfile()
      .toColourspace('cmyk')
      .toBuffer();
    const metadata = await sharp(data).metadata();
    t.assert.deepStrictEqual({ channels: metadata.channels, icc: metadata.icc }, { channels: 4, icc: undefined });
  });

  test('keep existing ICC profile, avoid colour transform', async (t) => {
    t.plan(1);
    const [r, g, b] = await sharp(fixtures.inputPngWithProPhotoProfile)
      .keepIccProfile()
      .raw()
      .toBuffer();
    t.assert.deepStrictEqual([r, g, b], [131, 141, 192]);
  });

  test('keep existing CMYK ICC profile', async (t) => {
    t.plan(1);
    const data = await sharp(fixtures.inputJpgWithCmykProfile)
      .pipelineColourspace('cmyk')
      .toColourspace('cmyk')
      .keepIccProfile()
      .toBuffer();
    const metadata = await sharp(data).metadata();
    t.assert.deepStrictEqual({ channels: metadata.channels, description: icc.parse(metadata.icc).description }, {
      channels: 4,
      description: 'U.S. Web Coated (SWOP) v2'
    });
  });

  test('transform to ICC profile and attach', async (t) => {
    t.plan(1);
    const data = await sharp({ create }).png().withIccProfile('p3', { attach: true }).toBuffer();
    const metadata = await sharp(data).metadata();
    t.assert.strictEqual(icc.parse(metadata.icc).description, 'sP3C');
  });

  test('transform to ICC profile but do not attach', async (t) => {
    t.plan(1);
    const data = await sharp({ create }).png().withIccProfile('p3', { attach: false }).toBuffer();
    const metadata = await sharp(data).metadata();
    t.assert.deepStrictEqual({ channels: metadata.channels, icc: metadata.icc }, { channels: 3, icc: undefined });
  });

  test('transform to invalid ICC profile emits warning', async (t) => {
    t.plan(1);
    const img = sharp({ create })
      .png()
      .withIccProfile(fixtures.path('invalid-illuminant.icc'));
    const warningsEmitted = [];
    img.on('warning', (warning) => {
      warningsEmitted.push(warning);
    });
    const data = await img.toBuffer();
    const metadata = await sharp(data).metadata();
    t.assert.deepStrictEqual({ warningsEmitted, channels: metadata.channels, icc: metadata.icc }, {
      warningsEmitted: ['Invalid profile'],
      channels: 3,
      icc: undefined
    });
  });

  test('Apply CMYK output ICC profile', async (t) => {
    t.plan(2);
    const output = fixtures.path('output.icc-cmyk.jpg');
    await sharp(fixtures.inputJpg)
      .resize(64)
      .withIccProfile('cmyk')
      .toFile(output);
    const metadata = await sharp(output).metadata();
    t.assert.deepStrictEqual(collect(metadata, {
      hasProfile: 'hasProfile',
      space: 'space',
      channels: 'channels',
      iccColorSpace: (value) => icc.parse(value.icc).colorSpace,
      iccIntent: (value) => icc.parse(value.icc).intent,
      iccDeviceClass: (value) => icc.parse(value.icc).deviceClass
    }), {
      hasProfile: true,
      space: 'cmyk',
      channels: 4,
      iccColorSpace: 'CMYK',
      iccIntent: 'Relative',
      iccDeviceClass: 'Printer'
    });
    t.assert.doesNotThrow(() => fixtures.assertSimilar(output, fixtures.expected('icc-cmyk.jpg'), { threshold: 1 }));
  });

  test('Apply custom output ICC profile', async (t) => {
    t.plan(1);
    const output = fixtures.path('output.hilutite.jpg');
    await sharp(fixtures.inputJpg)
      .resize(64)
      .withIccProfile(fixtures.path('hilutite.icm'))
      .toFile(output);
    t.assert.doesNotThrow(() => fixtures.assertMaxColourDistance(output, fixtures.expected('hilutite.jpg'), 9));
  });

  test('Include metadata in output, enabled via empty object', async (t) => {
    t.plan(1);
    const buffer = await sharp(fixtures.inputJpgWithExif)
      .withMetadata({})
      .toBuffer();
    const metadata = await sharp(buffer).metadata();
    t.assert.deepStrictEqual(collect(metadata, {
      hasProfile: 'hasProfile',
      orientation: 'orientation',
      exifType: (value) => typeof value.exif,
      exifBuffer: (value) => Buffer.isBuffer(value.exif),
      exifResolutionType: (value) => typeof exifReader(value.exif).Image.XResolution,
      iccType: (value) => typeof value.icc,
      iccBuffer: (value) => Buffer.isBuffer(value.icc),
      iccColorSpace: (value) => icc.parse(value.icc).colorSpace,
      iccIntent: (value) => icc.parse(value.icc).intent,
      iccDeviceClass: (value) => icc.parse(value.icc).deviceClass
    }), {
      hasProfile: true,
      orientation: 8,
      exifType: 'object',
      exifBuffer: true,
      exifResolutionType: 'number',
      iccType: 'object',
      iccBuffer: true,
      iccColorSpace: 'RGB',
      iccIntent: 'Perceptual',
      iccDeviceClass: 'Monitor'
    });
  });

  test('Remove EXIF metadata after a resize', async (t) => {
    t.plan(1);
    const buffer = await sharp(fixtures.inputJpgWithExif)
      .resize(320, 240)
      .toBuffer();
    const metadata = await sharp(buffer).metadata();
    t.assert.deepStrictEqual(collect(metadata, {
      hasProfile: 'hasProfile',
      orientationType: (value) => typeof value.orientation,
      exifType: (value) => typeof value.exif,
      iccType: (value) => typeof value.icc
    }), {
      hasProfile: false,
      orientationType: 'undefined',
      exifType: 'undefined',
      iccType: 'undefined'
    });
  });

  test('Remove metadata from PNG output', async (t) => {
    t.plan(1);
    const buffer = await sharp(fixtures.inputJpgWithExif).png().toBuffer();
    const metadata = await sharp(buffer).metadata();
    t.assert.deepStrictEqual(collect(metadata, {
      hasProfile: 'hasProfile',
      orientationType: (value) => typeof value.orientation,
      exifType: (value) => typeof value.exif,
      iccType: (value) => typeof value.icc
    }), {
      hasProfile: false,
      orientationType: 'undefined',
      exifType: 'undefined',
      iccType: 'undefined'
    });
  });

  test('Add EXIF metadata to JPEG', async (t) => {
    t.plan(1);
    const data = await sharp({ create })
      .jpeg()
      .withMetadata({
        exif: {
          IFD0: { Software: 'sharp' },
          IFD2: { ExposureTime: '0.2' }
        }
      })
      .toBuffer();
    const { exif } = await sharp(data).metadata();
    const parsedExif = exifReader(exif);
    t.assert.deepStrictEqual({ software: parsedExif.Image.Software, exposureTime: parsedExif.Photo.ExposureTime }, {
      software: 'sharp',
      exposureTime: 0.2
    });
  });

  test('withMetadata - set density of JPEG', async (t) => {
    t.plan(1);
    const data = await sharp({ create })
      .withMetadata({ density: 300 })
      .jpeg()
      .toBuffer();
    const { density } = await sharp(data).metadata();
    t.assert.strictEqual(density, 300);
  });

  test('withMetadata - set density of PNG', async (t) => {
    t.plan(1);
    const data = await sharp({ create })
      .withMetadata({ density: 96 })
      .png()
      .toBuffer();
    const { density } = await sharp(data).metadata();
    t.assert.strictEqual(density, 96);
  });

  test('withDensity - set density of JPEG', async (t) => {
    t.plan(1);
    const data = await sharp({ create }).withDensity(300).jpeg().toBuffer();
    const { density } = await sharp(data).metadata();
    t.assert.strictEqual(density, 300);
  });

  test('withDensity - set density of PNG', async (t) => {
    t.plan(1);
    const data = await sharp({ create }).withDensity(96).png().toBuffer();
    const { density } = await sharp(data).metadata();
    t.assert.strictEqual(density, 96);
  });

  test('chromaSubsampling 4:4:4:4 CMYK JPEG', async (t) => {
    t.plan(1);
    const metadata = await sharp(fixtures.inputJpgWithCmykProfile).metadata();
    t.assert.strictEqual(metadata.chromaSubsampling, '4:4:4:4');
  });

  test('chromaSubsampling 4:4:4 RGB JPEG', async (t) => {
    t.plan(1);
    const data = await sharp(fixtures.inputJpg)
      .resize(10, 10)
      .jpeg({ chromaSubsampling: '4:4:4' })
      .toBuffer();
    const metadata = await sharp(data).metadata();
    t.assert.strictEqual(metadata.chromaSubsampling, '4:4:4');
  });

  test('isProgressive JPEG', async (t) => {
    t.plan(1);
    const data = await sharp(fixtures.inputJpg)
      .resize(10, 10)
      .jpeg({ progressive: true })
      .toBuffer();
    const metadata = await sharp(data).metadata();
    t.assert.strictEqual(metadata.isProgressive, true);
  });

  test('isProgressive PNG', async (t) => {
    t.plan(1);
    const data = await sharp(fixtures.inputJpg)
      .resize(10, 10)
      .png({ progressive: true })
      .toBuffer();
    const metadata = await sharp(data).metadata();
    t.assert.strictEqual(metadata.isProgressive, true);
  });

  test('16-bit TIFF with TIFFTAG_PHOTOSHOP metadata', async (t) => {
    t.plan(1);
    const metadata = await sharp(fixtures.inputTifftagPhotoshop).metadata();
    t.assert.deepStrictEqual(collect(metadata, {
      format: 'format',
      mediaType: 'mediaType',
      width: 'width',
      height: 'height',
      space: 'space',
      channels: 'channels',
      tifftagPhotoshopType: (value) => typeof value.tifftagPhotoshop,
      tifftagPhotoshopBuffer: (value) => Buffer.isBuffer(value.tifftagPhotoshop),
      tifftagPhotoshopLength: (value) => value.tifftagPhotoshop.length
    }), {
      format: 'tiff',
      mediaType: 'image/tiff',
      width: 317,
      height: 211,
      space: 'rgb16',
      channels: 3,
      tifftagPhotoshopType: 'object',
      tifftagPhotoshopBuffer: true,
      tifftagPhotoshopLength: 6634
    });
  });

  test('AVIF', async (t) => {
    t.plan(1);
    const metadata = await sharp(fixtures.inputAvif).metadata();
    t.assert.deepStrictEqual(collect(metadata, {
      format: 'format',
      mediaType: 'mediaType',
      width: 'width',
      height: 'height',
      space: 'space',
      channels: 'channels',
      depth: 'depth',
      isProgressive: 'isProgressive',
      isPalette: 'isPalette',
      bitsPerSample: 'bitsPerSample',
      pages: 'pages',
      pagePrimary: 'pagePrimary',
      compression: 'compression',
      hasProfile: 'hasProfile',
      hasAlpha: 'hasAlpha',
      autoOrient: 'autoOrient'
    }), {
      format: 'heif',
      mediaType: 'image/avif',
      width: 2048,
      height: 858,
      space: 'srgb',
      channels: 3,
      depth: 'uchar',
      isProgressive: false,
      isPalette: false,
      bitsPerSample: 8,
      pages: 1,
      pagePrimary: 0,
      compression: 'av1',
      hasProfile: false,
      hasAlpha: false,
      autoOrient: { width: 2048, height: 858 }
    });
  });

  test('withMetadata adds default sRGB profile', async (t) => {
    t.plan(1);
    const data = await sharp(fixtures.inputJpg)
      .resize(32, 24)
      .withMetadata()
      .toBuffer();
    const metadata = await sharp(data).metadata();
    t.assert.deepStrictEqual({
      colorSpace: icc.parse(metadata.icc).colorSpace,
      deviceClass: icc.parse(metadata.icc).deviceClass,
      intent: icc.parse(metadata.icc).intent
    }, {
      colorSpace: 'RGB',
      deviceClass: 'Monitor',
      intent: 'Perceptual'
    });
  });

  test('withMetadata adds default sRGB profile to RGB16', async (t) => {
    t.plan(1);
    const data = await sharp({ create })
      .toColorspace('rgb16')
      .png()
      .withMetadata()
      .toBuffer();
    const metadata = await sharp(data).metadata();
    t.assert.deepStrictEqual({
      depth: metadata.depth,
      description: icc.parse(metadata.icc).description
    }, {
      depth: 'ushort',
      description: 'sRGB'
    });
  });

  test('withMetadata adds P3 profile to 16-bit PNG', async (t) => {
    t.plan(1);
    const data = await sharp({ create })
      .toColorspace('rgb16')
      .png()
      .withMetadata({ icc: 'p3' })
      .toBuffer();
    const metadata = await sharp(data).metadata();
    t.assert.deepStrictEqual({
      depth: metadata.depth,
      description: icc.parse(metadata.icc).description
    }, {
      depth: 'ushort',
      description: 'sP3C'
    });
  });

  test('File input with corrupt header fails gracefully', async (t) => {
    t.plan(1);
    await t.assert.rejects(() => sharp(fixtures.inputJpgWithCorruptHeader).metadata(), /Input file has corrupt header: VipsJpeg: premature end of/);
  });

  test('Buffer input with corrupt header fails gracefully', async (t) => {
    t.plan(1);
    const input = await fs.readFile(fixtures.inputJpgWithCorruptHeader);
    await t.assert.rejects(() => sharp(input).metadata(), /Input buffer has corrupt header: VipsJpeg: premature end of/);
  });

  test('Lossless JPEG', async (t) => {
    t.plan(1);
    const metadata = await sharp(fixtures.inputJpgLossless).metadata();
    t.assert.deepStrictEqual(collect(metadata, {
      format: 'format',
      mediaType: 'mediaType',
      width: 'width',
      height: 'height',
      space: 'space',
      channels: 'channels',
      depth: 'depth',
      density: 'density',
      chromaSubsampling: 'chromaSubsampling',
      isProgressive: 'isProgressive',
      isPalette: 'isPalette',
      hasProfile: 'hasProfile',
      hasAlpha: 'hasAlpha',
      autoOrient: 'autoOrient'
    }), {
      format: 'jpeg',
      mediaType: 'image/jpeg',
      width: 227,
      height: 149,
      space: 'srgb',
      channels: 3,
      depth: 'uchar',
      density: 72,
      chromaSubsampling: '4:4:4',
      isProgressive: false,
      isPalette: false,
      hasProfile: false,
      hasAlpha: false,
      autoOrient: { width: 227, height: 149 }
    });
  });

  test('keepExif maintains all EXIF metadata', async (t) => {
    t.plan(1);
    const data1 = await sharp({ create })
      .withExif({
        IFD0: {
          Copyright: 'Test 1',
          Software: 'sharp'
        }
      })
      .jpeg()
      .toBuffer();
    const data2 = await sharp(data1).keepExif().toBuffer();
    const md2 = await sharp(data2).metadata();
    const exif2 = exifReader(md2.exif);
    t.assert.deepStrictEqual({ copyright: exif2.Image.Copyright, software: exif2.Image.Software }, {
      copyright: 'Test 1',
      software: 'sharp'
    });
  });

  test('withExif replaces all EXIF metadata', async (t) => {
    t.plan(1);
    const data1 = await sharp({ create })
      .withExif({
        IFD0: {
          Copyright: 'Test 1',
          Software: 'sharp'
        }
      })
      .jpeg()
      .toBuffer();
    const md1 = await sharp(data1).metadata();
    const exif1 = exifReader(md1.exif);
    const data2 = await sharp(data1)
      .withExif({
        IFD0: {
          Copyright: 'Test 2'
        }
      })
      .toBuffer();
    const md2 = await sharp(data2).metadata();
    const exif2 = exifReader(md2.exif);
    t.assert.deepStrictEqual({ firstCopyright: exif1.Image.Copyright, firstSoftware: exif1.Image.Software, secondCopyright: exif2.Image.Copyright, secondSoftware: exif2.Image.Software }, {
      firstCopyright: 'Test 1',
      firstSoftware: 'sharp',
      secondCopyright: 'Test 2',
      secondSoftware: undefined
    });
  });

  test('withExifMerge merges all EXIF metadata', async (t) => {
    t.plan(1);
    const data1 = await sharp({ create })
      .withExif({
        IFD0: {
          Copyright: 'Test 1'
        }
      })
      .jpeg()
      .toBuffer();
    const md1 = await sharp(data1).metadata();
    const exif1 = exifReader(md1.exif);
    const data2 = await sharp(data1)
      .withExifMerge({
        IFD0: {
          Copyright: 'Test 2',
          Software: 'sharp'
        }
      })
      .toBuffer();
    const md2 = await sharp(data2).metadata();
    const exif2 = exifReader(md2.exif);
    t.assert.deepStrictEqual({ firstCopyright: exif1.Image.Copyright, firstSoftware: exif1.Image.Software, secondCopyright: exif2.Image.Copyright, secondSoftware: exif2.Image.Software }, {
      firstCopyright: 'Test 1',
      firstSoftware: undefined,
      secondCopyright: 'Test 2',
      secondSoftware: 'sharp'
    });
  });

  suite('XMP metadata tests', () => {
    test('withMetadata preserves existing XMP metadata from input', async (t) => {
      t.plan(1);
      const data = await sharp(fixtures.inputJpgWithIptcAndXmp)
        .resize(320, 240)
        .withMetadata()
        .toBuffer();
      const metadata = await sharp(data).metadata();
      t.assert.deepStrictEqual(collect(metadata, {
        xmpType: (value) => typeof value.xmp,
        xmpBuffer: (value) => Buffer.isBuffer(value.xmp),
        xmpStart: (value) => value.xmp.indexOf(Buffer.from('<?xpacket begin="'))
      }), {
        xmpType: 'object',
        xmpBuffer: true,
        xmpStart: 0
      });
    });

    test('keepXmp preserves existing XMP metadata from input', async (t) => {
      t.plan(1);
      const data = await sharp(fixtures.inputJpgWithIptcAndXmp)
        .resize(320, 240)
        .keepXmp()
        .toBuffer();
      const metadata = await sharp(data).metadata();
      t.assert.deepStrictEqual(collect(metadata, {
        xmpType: (value) => typeof value.xmp,
        xmpBuffer: (value) => Buffer.isBuffer(value.xmp),
        xmpStart: (value) => value.xmp.indexOf(Buffer.from('<?xpacket begin="'))
      }), {
        xmpType: 'object',
        xmpBuffer: true,
        xmpStart: 0
      });
    });

    test('withXmp with custom XMP replaces existing XMP', async (t) => {
      t.plan(1);
      const customXmp = '<?xml version="1.0"?><x:xmpmeta xmlns:x="adobe:ns:meta/"><rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"><rdf:Description rdf:about="" xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:creator><rdf:Seq><rdf:li>Test Creator</rdf:li></rdf:Seq></dc:creator><dc:title><rdf:Alt><rdf:li xml:lang="x-default">Test Title</rdf:li></rdf:Alt></dc:title></rdf:Description></rdf:RDF></x:xmpmeta>';
      const data = await sharp(fixtures.inputJpgWithIptcAndXmp)
        .resize(320, 240)
        .withXmp(customXmp)
        .toBuffer();
      const metadata = await sharp(data).metadata();
      t.assert.deepStrictEqual(collect(metadata, {
        xmpType: (value) => typeof value.xmp,
        xmpBuffer: (value) => Buffer.isBuffer(value.xmp),
        includesCreator: (value) => value.xmp.toString().includes('Test Creator'),
        includesTitle: (value) => value.xmp.toString().includes('Test Title')
      }), {
        xmpType: 'object',
        xmpBuffer: true,
        includesCreator: true,
        includesTitle: true
      });
    });

    test('withXmp with custom XMP buffer on image without existing XMP', async (t) => {
      t.plan(1);
      const customXmp = '<?xml version="1.0"?><x:xmpmeta xmlns:x="adobe:ns:meta/"><rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"><rdf:Description rdf:about="" xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:description><rdf:Alt><rdf:li xml:lang="x-default">Added via Sharp</rdf:li></rdf:Alt></dc:description></rdf:Description></rdf:RDF></x:xmpmeta>';
      const data = await sharp(fixtures.inputJpg)
        .resize(320, 240)
        .withXmp(customXmp)
        .toBuffer();
      const metadata = await sharp(data).metadata();
      t.assert.deepStrictEqual(collect(metadata, {
        xmpType: (value) => typeof value.xmp,
        xmpBuffer: (value) => Buffer.isBuffer(value.xmp),
        includesText: (value) => value.xmp.toString().includes('Added via Sharp')
      }), {
        xmpType: 'object',
        xmpBuffer: true,
        includesText: true
      });
    });

    test('withXmp with valid XMP metadata for different image formats', async (t) => {
      t.plan(1);
      const customXmp = '<?xml version="1.0"?><x:xmpmeta xmlns:x="adobe:ns:meta/"><rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"><rdf:Description rdf:about="" xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:subject><rdf:Bag><rdf:li>test</rdf:li><rdf:li>metadata</rdf:li></rdf:Bag></dc:subject></rdf:Description></rdf:RDF></x:xmpmeta>';
      const jpegData = await sharp(fixtures.inputJpg).resize(100, 100).jpeg().withXmp(customXmp).toBuffer();
      const pngData = await sharp(fixtures.inputJpg).resize(100, 100).png().withXmp(customXmp).toBuffer();
      const webpData = await sharp(fixtures.inputJpg).resize(100, 100).webp().withXmp(customXmp).toBuffer();
      const jpegMetadata = await sharp(jpegData).metadata();
      const pngMetadata = await sharp(pngData).metadata();
      const webpMetadata = await sharp(webpData).metadata();
      t.assert.deepStrictEqual({
        jpegFormat: jpegMetadata.format,
        jpegXmp: Buffer.isBuffer(jpegMetadata.xmp),
        pngFormat: pngMetadata.format,
        pngXmp: Buffer.isBuffer(pngMetadata.xmp),
        webpFormat: webpMetadata.format,
        webpXmp: Buffer.isBuffer(webpMetadata.xmp)
      }, {
        jpegFormat: 'jpeg',
        jpegXmp: true,
        pngFormat: 'png',
        pngXmp: true,
        webpFormat: 'webp',
        webpXmp: true
      });
    });

    test('XMP metadata persists through multiple operations', async (t) => {
      t.plan(1);
      const customXmp = '<?xml version="1.0"?><x:xmpmeta xmlns:x="adobe:ns:meta/"><rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"><rdf:Description rdf:about="" xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:identifier>persistent-test</dc:identifier></rdf:Description></rdf:RDF></x:xmpmeta>';
      const data = await sharp(fixtures.inputJpg)
        .resize(320, 240)
        .withXmp(customXmp)
        .rotate(90)
        .blur(1)
        .sharpen()
        .toBuffer();
      const metadata = await sharp(data).metadata();
      t.assert.deepStrictEqual(collect(metadata, {
        xmpType: (value) => typeof value.xmp,
        xmpBuffer: (value) => Buffer.isBuffer(value.xmp),
        includesText: (value) => value.xmp.toString().includes('persistent-test')
      }), {
        xmpType: 'object',
        xmpBuffer: true,
        includesText: true
      });
    });

    test('withXmp XMP works with WebP format specifically', async (t) => {
      t.plan(1);
      const webpXmp = '<?xml version="1.0"?><x:xmpmeta xmlns:x="adobe:ns:meta/"><rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"><rdf:Description rdf:about="" xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:creator><rdf:Seq><rdf:li>WebP Creator</rdf:li></rdf:Seq></dc:creator><dc:format>image/webp</dc:format></rdf:Description></rdf:RDF></x:xmpmeta>';
      const data = await sharp(fixtures.inputJpg)
        .resize(120, 80)
        .webp({ quality: 80 })
        .withXmp(webpXmp)
        .toBuffer();
      const metadata = await sharp(data).metadata();
      t.assert.deepStrictEqual(collect(metadata, {
        format: 'format',
        xmpType: (value) => typeof value.xmp,
        xmpBuffer: (value) => Buffer.isBuffer(value.xmp),
        includesCreator: (value) => value.xmp.toString().includes('WebP Creator'),
        includesWebp: (value) => value.xmp.toString().includes('image/webp')
      }), {
        format: 'webp',
        xmpType: 'object',
        xmpBuffer: true,
        includesCreator: true,
        includesWebp: true
      });
    });

    test('withXmp XMP validation - non-string input', (t) => {
      t.plan(1);
      t.assert.throws(() => sharp().withXmp(123), /Expected non-empty string for xmp but received 123 of type number/);
    });

    test('withXmp XMP validation - null input', (t) => {
      t.plan(1);
      t.assert.throws(() => sharp().withXmp(null), /Expected non-empty string for xmp but received null of type object/);
    });

    test('withXmp XMP validation - empty string', (t) => {
      t.plan(1);
      t.assert.throws(() => sharp().withXmp(''), /Expected non-empty string for xmp/);
    });
  });

  suite('Invalid parameters', () => {
    test('String orientation', (t) => {
      t.plan(1);
      t.assert.throws(() => sharp().withMetadata({ orientation: 'zoinks' }));
    });
    test('Negative orientation', (t) => {
      t.plan(1);
      t.assert.throws(() => sharp().withMetadata({ orientation: -1 }));
    });
    test('Zero orientation', (t) => {
      t.plan(1);
      t.assert.throws(() => sharp().withMetadata({ orientation: 0 }));
    });
    test('Too large orientation', (t) => {
      t.plan(1);
      t.assert.throws(() => sharp().withMetadata({ orientation: 9 }));
    });
    test('Non-numeric density', (t) => {
      t.plan(1);
      t.assert.throws(() => sharp().withMetadata({ density: '1' }));
    });
    test('Negative density', (t) => {
      t.plan(1);
      t.assert.throws(() => sharp().withMetadata({ density: -1 }));
    });
    test('Non string icc', (t) => {
      t.plan(1);
      t.assert.throws(() => sharp().withMetadata({ icc: true }));
    });
    test('Non object exif', (t) => {
      t.plan(1);
      t.assert.throws(() => sharp().withMetadata({ exif: false }));
    });
    test('Non string value in object exif', (t) => {
      t.plan(1);
      t.assert.throws(() => sharp().withMetadata({ exif: { ifd0: false } }));
    });
    test('Non string value in nested object exif', (t) => {
      t.plan(1);
      t.assert.throws(() => sharp().withMetadata({ exif: { ifd0: { fail: false } } }));
    });
    test('withIccProfile invalid profile', (t) => {
      t.plan(1);
      t.assert.throws(() => sharp().withIccProfile(false), /Expected string for icc but received false of type boolean/);
    });
    test('withIccProfile missing attach', (t) => {
      t.plan(1);
      t.assert.doesNotThrow(() => sharp().withIccProfile('test', {}));
    });
    test('withIccProfile invalid attach', (t) => {
      t.plan(1);
      t.assert.throws(() => sharp().withIccProfile('test', { attach: 1 }), /Expected boolean for attach but received 1 of type number/);
    });
    test('withDensity missing density', (t) => {
      t.plan(1);
      t.assert.throws(() => sharp().withDensity(), /Expected positive number for density but received undefined of type undefined/);
    });
    test('withDensity invalid density', (t) => {
      t.plan(1);
      t.assert.throws(() => sharp().withDensity('invalid'), /Expected positive number for density but received invalid of type string/);
    });
  });
});