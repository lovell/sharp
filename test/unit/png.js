/*!
  Copyright 2013 Lovell Fuller and others.
  SPDX-License-Identifier: Apache-2.0
*/

const fs = require('node:fs/promises');
const { suite, test } = require('node:test');

const sharp = require('../../');
const fixtures = require('../fixtures');

suite('PNG', () => {
  test('compression level is valid', (t) => {
    t.plan(1);
    t.assert.doesNotThrow(() => {
      sharp().png({ compressionLevel: 0 });
    });
  });

  test('compression level is invalid', (t) => {
    t.plan(1);
    t.assert.throws(() => {
      sharp().png({ compressionLevel: -1 });
    });
  });

  test('default compressionLevel generates smaller file than compressionLevel=0', async (t) => {
    t.plan(5);
    // First generate with default compressionLevel
    const defaultBuffer = await sharp(fixtures.inputPng)
      .resize(320, 240)
      .png()
      .toBuffer({ resolveWithObject: true });
    t.assert.strictEqual(true, defaultBuffer.data.length > 0);
    t.assert.strictEqual('png', defaultBuffer.info.format);
    // Then generate with compressionLevel=6
    const largerBuffer = await sharp(fixtures.inputPng)
      .resize(320, 240)
      .png({ compressionLevel: 0 })
      .toBuffer({ resolveWithObject: true });
    t.assert.strictEqual(true, largerBuffer.data.length > 0);
    t.assert.strictEqual('png', largerBuffer.info.format);
    t.assert.strictEqual(true, defaultBuffer.data.length < largerBuffer.data.length);
  });

  test('without adaptiveFiltering generates smaller file', async (t) => {
    t.plan(11);
    // First generate with adaptive filtering
    const adaptiveBuffer = await sharp(fixtures.inputPng)
      .resize(320, 240)
      .png({ adaptiveFiltering: true })
      .toBuffer({ resolveWithObject: true });
    t.assert.strictEqual(true, adaptiveBuffer.data.length > 0);
    t.assert.strictEqual(adaptiveBuffer.data.length, adaptiveBuffer.info.size);
    t.assert.strictEqual('png', adaptiveBuffer.info.format);
    t.assert.strictEqual(320, adaptiveBuffer.info.width);
    t.assert.strictEqual(240, adaptiveBuffer.info.height);
    // Then generate without
    const withoutAdaptiveBuffer = await sharp(fixtures.inputPng)
      .resize(320, 240)
      .png({ adaptiveFiltering: false })
      .toBuffer({ resolveWithObject: true });
    t.assert.strictEqual(true, withoutAdaptiveBuffer.data.length > 0);
    t.assert.strictEqual(withoutAdaptiveBuffer.data.length, withoutAdaptiveBuffer.info.size);
    t.assert.strictEqual('png', withoutAdaptiveBuffer.info.format);
    t.assert.strictEqual(320, withoutAdaptiveBuffer.info.width);
    t.assert.strictEqual(240, withoutAdaptiveBuffer.info.height);
    t.assert.strictEqual(true, withoutAdaptiveBuffer.data.length < adaptiveBuffer.data.length);
  });

  test('Invalid PNG adaptiveFiltering value throws error', (t) => {
    t.plan(1);
    t.assert.throws(() => {
      sharp().png({ adaptiveFiltering: 1 });
    });
  });

  test('Progressive PNG image', async (t) => {
    t.plan(11);
    const nonProgressiveBuffer = await sharp(fixtures.inputJpg)
      .resize(320, 240)
      .png({ progressive: false })
      .toBuffer({ resolveWithObject: true });
    t.assert.strictEqual(true, nonProgressiveBuffer.data.length > 0);
    t.assert.strictEqual(nonProgressiveBuffer.data.length, nonProgressiveBuffer.info.size);
    t.assert.strictEqual('png', nonProgressiveBuffer.info.format);
    t.assert.strictEqual(320, nonProgressiveBuffer.info.width);
    t.assert.strictEqual(240, nonProgressiveBuffer.info.height);
    const progressiveBuffer = await sharp(nonProgressiveBuffer.data)
      .png({ progressive: true })
      .toBuffer({ resolveWithObject: true });
    t.assert.strictEqual(true, progressiveBuffer.data.length > 0);
    t.assert.strictEqual(progressiveBuffer.data.length, progressiveBuffer.info.size);
    t.assert.strictEqual(true, progressiveBuffer.data.length > nonProgressiveBuffer.data.length);
    t.assert.strictEqual('png', progressiveBuffer.info.format);
    t.assert.strictEqual(320, progressiveBuffer.info.width);
    t.assert.strictEqual(240, progressiveBuffer.info.height);
  });

  test('16-bit grey+alpha PNG identity transform', async (t) => {
    t.plan(1);
    const actual = fixtures.path('output.16-bit-grey-alpha-identity.png');
    await sharp(fixtures.inputPng16BitGreyAlpha)
      .toFile(actual);
    t.assert.doesNotThrow(() => {
      fixtures.assertMaxColourDistance(actual, fixtures.expected('16-bit-grey-alpha-identity.png'));
    });
  });

  test('16-bit grey+alpha PNG roundtrip', async (t) => {
    t.plan(1);
    const after = await sharp(fixtures.inputPng16BitGreyAlpha)
      .toColourspace('grey16')
      .toBuffer();

    const [alphaMeanBefore, alphaMeanAfter] = (
      await Promise.all([
        sharp(fixtures.inputPng16BitGreyAlpha).stats(),
        sharp(after).stats()
      ])
    )
      .map(stats => stats.channels[1].mean);

    t.assert.strictEqual(alphaMeanAfter, alphaMeanBefore);
  });

  test('palette decode/encode roundtrip', async (t) => {
    t.plan(1);
    const data = await sharp(fixtures.inputPngPalette)
      .png({ effort: 1, palette: true })
      .toBuffer();

    const { size, ...metadata } = await sharp(data).metadata();
    void size;
    t.assert.deepStrictEqual(metadata, {
      autoOrient: {
        height: 68,
        width: 68
      },
      format: 'png',
      mediaType: 'image/png',
      width: 68,
      height: 68,
      space: 'srgb',
      channels: 3,
      density: 72,
      depth: 'uchar',
      isProgressive: false,
      isPalette: true,
      bitsPerSample: 8,
      hasProfile: false,
      hasAlpha: false
    });
  });

  test('Valid PNG libimagequant palette value does not throw error', (t) => {
    t.plan(1);
    t.assert.doesNotThrow(() => {
      sharp().png({ palette: false });
    });
  });

  test('Invalid PNG libimagequant palette value throws error', (t) => {
    t.plan(1);
    t.assert.throws(() => {
      sharp().png({ palette: 'fail' });
    });
  });

  test('Valid PNG libimagequant quality value produces image of same size or smaller', async (t) => {
    t.plan(1);
    const inputPngBuffer = await fs.readFile(fixtures.inputPng);
    const data = await Promise.all([
      sharp(inputPngBuffer).resize(10).png({ effort: 1, quality: 80 }).toBuffer(),
      sharp(inputPngBuffer).resize(10).png({ effort: 1, quality: 100 }).toBuffer()
    ]);
    t.assert.strictEqual(true, data[0].length <= data[1].length);
  });

  test('Invalid PNG libimagequant quality value throws error', (t) => {
    t.plan(1);
    t.assert.throws(() => {
      sharp().png({ quality: 101 });
    });
  });

  test('Invalid effort value throws error', (t) => {
    t.plan(1);
    t.assert.throws(() => {
      sharp().png({ effort: 0.1 });
    });
  });

  test('Valid PNG libimagequant colours value produces image of same size or smaller', async (t) => {
    t.plan(1);
    const inputPngBuffer = await fs.readFile(fixtures.inputPng);
    const data = await Promise.all([
      sharp(inputPngBuffer).resize(10).png({ colours: 100 }).toBuffer(),
      sharp(inputPngBuffer).resize(10).png({ colours: 200 }).toBuffer()
    ]);
    t.assert.strictEqual(true, data[0].length <= data[1].length);
  });

  test('Invalid PNG libimagequant colours value throws error', (t) => {
    t.plan(1);
    t.assert.throws(() => {
      sharp().png({ colours: -1 });
    });
  });

  test('Invalid PNG libimagequant colors value throws error', (t) => {
    t.plan(1);
    t.assert.throws(() => {
      sharp().png({ colors: 0.1 });
    });
  });

  test('Can set bitdepth of PNG without palette', async (t) => {
    t.plan(4);
    const data = await sharp({
      create: {
        width: 8, height: 8, channels: 3, background: 'red'
      }
    })
      .toColourspace('b-w')
      .png({ colours: 2, palette: false })
      .toBuffer();

    const { channels, isPalette, bitsPerSample, space } = await sharp(data).metadata();
    t.assert.strictEqual(channels, 1);
    t.assert.strictEqual(isPalette, false);
    t.assert.strictEqual(bitsPerSample, 1);
    t.assert.strictEqual(space, 'b-w');
  });

  test('Valid PNG libimagequant dither value produces image of same size or smaller', async (t) => {
    t.plan(1);
    const inputPngBuffer = await fs.readFile(fixtures.inputPng);
    const data = await Promise.all([
      sharp(inputPngBuffer).resize(10).png({ dither: 0.1 }).toBuffer(),
      sharp(inputPngBuffer).resize(10).png({ dither: 0.9 }).toBuffer()
    ]);
    t.assert.strictEqual(true, data[0].length <= data[1].length);
  });

  test('Invalid PNG libimagequant dither value throws error', (t) => {
    t.plan(1);
    t.assert.throws(() => {
      sharp().png({ dither: 'fail' });
    });
  });
});
