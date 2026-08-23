/*!
  Copyright 2013 Lovell Fuller and others.
  SPDX-License-Identifier: Apache-2.0
*/

import { suite, test } from 'node:test';

import sharp from '../../lib/index.js';
import fixtures from '../fixtures/index.js';

suite('Colour space conversion', () => {
  test('To greyscale', async (t) => {
    t.plan(1);
    const { info } = await sharp(fixtures.inputJpg)
      .resize(8)
      .greyscale()
      .raw()
      .toBuffer({ resolveWithObject: true });
    t.assert.strictEqual(info.channels, 1);
  });

  test('Not to greyscale', async (t) => {
    t.plan(1);
    const { info } = await sharp(fixtures.inputJpg)
      .resize(320, 240)
      .greyscale(false)
      .raw()
      .toBuffer({ resolveWithObject: true });
    t.assert.strictEqual(info.channels, 3);
  });

  test('Greyscale with single channel output', async (t) => {
    t.plan(4);
    const { data, info } = await sharp(fixtures.inputJpg)
      .resize(320, 240)
      .greyscale()
      .toColourspace('b-w')
      .toBuffer({ resolveWithObject: true });
    t.assert.strictEqual(1, info.channels);
    t.assert.strictEqual(320, info.width);
    t.assert.strictEqual(240, info.height);
    await t.assert.doesNotReject(() => fixtures.assertSimilar(fixtures.expected('output.greyscale-single.jpg'), data));
  });

  test('From 1-bit TIFF to sRGB WebP', async (t) => {
    t.plan(1);
    const data = await sharp(fixtures.inputTiff)
      .resize(8, 8)
      .webp()
      .toBuffer();

    const { format } = await sharp(data).metadata();
    t.assert.strictEqual(format, 'webp');
  });

  test('From CMYK to sRGB', async (t) => {
    t.plan(3);
    const { data, info } = await sharp(fixtures.inputJpgWithCmykProfile)
      .resize(320)
      .toBuffer({ resolveWithObject: true });
    t.assert.strictEqual(true, data.length > 0);
    t.assert.strictEqual('jpeg', info.format);
    t.assert.strictEqual(320, info.width);
  });

  test('From CMYK to sRGB with white background, not yellow', async (t) => {
    t.plan(4);
    const { data, info } = await sharp(fixtures.inputJpgWithCmykProfile)
      .resize(320, 240, {
        fit: sharp.fit.contain,
        background: 'white'
      })
      .toBuffer({ resolveWithObject: true });
    t.assert.strictEqual('jpeg', info.format);
    t.assert.strictEqual(320, info.width);
    t.assert.strictEqual(240, info.height);
    await t.assert.doesNotReject(() => fixtures.assertSimilar(fixtures.expected('colourspace.cmyk.jpg'), data));
  });

  test('From profile-less CMYK to sRGB', async (t) => {
    t.plan(3);
    const { data, info } = await sharp(fixtures.inputJpgWithCmykNoProfile)
      .resize(320)
      .toBuffer({ resolveWithObject: true });
    t.assert.strictEqual('jpeg', info.format);
    t.assert.strictEqual(320, info.width);
    await t.assert.doesNotReject(() => fixtures.assertSimilar(fixtures.expected('colourspace.cmyk-without-profile.jpg'), data));
  });

  test('Profile-less CMYK roundtrip', async (t) => {
    t.plan(1);
    const [c, m, y, k] = await sharp(fixtures.inputJpgWithCmykNoProfile)
      .pipelineColourspace('cmyk')
      .toColourspace('cmyk')
      .raw()
      .toBuffer();

    t.assert.deepStrictEqual(
      { c, m, y, k },
      { c: 55, m: 27, y: 0, k: 0 }
    );
  });

  test('CMYK profile to CMYK profile conversion using perceptual intent', async (t) => {
    t.plan(1);
    const data = await sharp(fixtures.inputTiffFogra)
      .resize(320, 240)
      .toColourspace('cmyk')
      .pipelineColourspace('cmyk')
      .withIccProfile(fixtures.path('XCMYK 2017.icc'))
      .raw()
      .toBuffer();

    const [c, m, y, k] = data;
    t.assert.deepStrictEqual(
      { c, m, y, k },
      { c: 1, m: 239, y: 227, k: 5 }
    );
  });

  test('CMYK profile to CMYK profile with negate', async (t) => {
    t.plan(4);
    const { data, info } = await sharp(fixtures.inputTiffFogra)
      .resize(320, 240)
      .toColourspace('cmyk')
      .pipelineColourspace('cmyk')
      .withIccProfile(fixtures.path('XCMYK 2017.icc'))
      .negate()
      .toBuffer({ resolveWithObject: true });
    t.assert.strictEqual('tiff', info.format);
    t.assert.strictEqual(320, info.width);
    t.assert.strictEqual(240, info.height);
    await t.assert.doesNotReject(() => fixtures.assertSimilar(
      fixtures.expected('colourspace.cmyk-to-cmyk-negated.tif'),
      data,
      { threshold: 0 }
    ));
  });

  test('From sRGB with RGB16 pipeline, resize with gamma, to sRGB', async (t) => {
    t.plan(2);
    const { data, info } = await sharp(fixtures.inputPngGradients)
      .pipelineColourspace('rgb16')
      .resize(320)
      .gamma()
      .toColourspace('srgb')
      .toBuffer({ resolveWithObject: true });
    t.assert.strictEqual(320, info.width);
    await t.assert.doesNotReject(() => fixtures.assertSimilar(fixtures.expected('colourspace-gradients-gamma-resize.png'), data, {
      threshold: 0
    }));
  });

  test('Convert P3 to sRGB', async (t) => {
    t.plan(3);
    const [r, g, b] = await sharp(fixtures.inputPngP3)
      .raw()
      .toBuffer();
    t.assert.strictEqual(r, 255);
    t.assert.strictEqual(g, 0);
    t.assert.strictEqual(b, 0);
  });

  test('Passthrough P3', async (t) => {
    t.plan(3);
    const [r, g, b] = await sharp(fixtures.inputPngP3)
      .withMetadata({ icc: 'p3' })
      .raw()
      .toBuffer();
    t.assert.strictEqual(r, 234);
    t.assert.strictEqual(g, 51);
    t.assert.strictEqual(b, 34);
  });

  test('Invalid pipelineColourspace input', (t) => {
    t.plan(1);
    t.assert.throws(() => {
      sharp(fixtures.inputJpg)
        .pipelineColorspace(null);
    }, /Expected string for colourspace but received null of type object/);
  });

  test('Invalid toColourspace input', (t) => {
    t.plan(1);
    t.assert.throws(() => {
      sharp(fixtures.inputJpg)
        .toColourspace(null);
    });
  });
});
