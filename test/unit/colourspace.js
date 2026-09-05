/*!
  Copyright 2013 Lovell Fuller and others.
  SPDX-License-Identifier: Apache-2.0
*/

const { suite, test } = require('node:test');

const sharp = require('../../');
const fixtures = require('../fixtures');

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

  suite('Device-independent pipeline colourspace', () => {
    const size = 64;

    // Alternating black and white pixels, so every reduced pixel averages the two
    const checkerboard = () => {
      const data = Buffer.alloc(size * size * 3);
      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          const i = (y * size + x) * 3;
          data.fill((x + y) % 2 ? 255 : 0, i, i + 3);
        }
      }
      return sharp(data, { raw: { width: size, height: size, channels: 3 } })
        .png()
        .withIccProfile('p3')
        .toBuffer();
    };

    const swatch = (profile) => {
      const data = Buffer.alloc(size * size * 3);
      for (let i = 0; i < data.length; i += 3) {
        data.set([200, 60, 30], i);
      }
      const image = sharp(data, { raw: { width: size, height: size, channels: 3 } }).png();
      return (profile ? image.withIccProfile(profile) : image).toBuffer();
    };

    for (const [space, expected] of [['srgb', 128], ['rgb16', 128], ['scrgb', 188], ['xyz', 188]]) {
      test(`Reduces a profiled image in ${space}`, async (t) => {
        t.plan(1);
        const { data } = await sharp(await checkerboard())
          .pipelineColourspace(space)
          .resize(8)
          .raw()
          .toBuffer({ resolveWithObject: true });
        const mean = data.reduce((sum, value) => sum + value, 0) / data.length;
        t.assert.ok(Math.abs(mean - expected) <= 1, `expected ~${expected}, saw ${mean.toFixed(2)}`);
      });
    }

    for (const space of ['scrgb', 'xyz', 'yxy', 'lab', 'labs', 'lch']) {
      test(`Applies the embedded profile in ${space}`, async (t) => {
        t.plan(1);
        const render = async (profile) => [...await sharp(await swatch(profile))
          .pipelineColourspace(space)
          .raw()
          .toBuffer()].slice(0, 3);
        const p3 = await render('p3');
        const srgb = await render();
        t.assert.ok(p3.every((value, i) => Math.abs(value - srgb[i]) <= 5), `p3 ${p3}, sRGB ${srgb}`);
      });
    }

    test('Keeps the P3 working profile in rgb16', async (t) => {
      t.plan(3);
      const [r, g, b] = await sharp(fixtures.inputPngP3)
        .pipelineColourspace('rgb16')
        .withIccProfile('p3')
        .raw()
        .toBuffer();
      t.assert.strictEqual(r, 242);
      t.assert.strictEqual(g, 0);
      t.assert.strictEqual(b, 0);
    });

    test('Ignores the input profile regardless of pipeline colourspace', async (t) => {
      t.plan(1);
      const render = async (space) => [...await sharp(fixtures.inputPngP3, { ignoreIcc: true })
        .pipelineColourspace(space)
        .withIccProfile('srgb') // output profile differing from the embedded one, so the export is not an identity
        .raw()
        .toBuffer()].slice(0, 3);
      t.assert.deepStrictEqual(await render('scrgb'), await render('srgb'));
    });

    test('Passthrough P3 without gamut loss', async (t) => {
      t.plan(3);
      const [r, g, b] = await sharp(fixtures.inputPngP3)
        .pipelineColourspace('scrgb')
        .withIccProfile('p3')
        .raw()
        .toBuffer();
      t.assert.strictEqual(r, 241);
      t.assert.strictEqual(g, 0);
      t.assert.strictEqual(b, 0);
    });
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
