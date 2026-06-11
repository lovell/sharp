/*!
  Copyright 2013 Lovell Fuller and others.
  SPDX-License-Identifier: Apache-2.0
*/

import { suite, test } from 'node:test';

import sharp from '../../lib/index.js';
import is from '../../lib/is.js';
const { inRange } = is;
import fixtures from '../fixtures/index.js';

suite('Trim borders', () => {
  test('Skip shrink-on-load', async (t) => {
    t.plan(5);
    const expected = fixtures.expected('alpha-layer-2-trim-resize.jpg');
    const { data, info } = await sharp(fixtures.inputJpgOverlayLayer2)
      .trim()
      .resize({
        width: 300,
        fastShrinkOnLoad: false
      })
      .toBuffer({ resolveWithObject: true });
    t.assert.strictEqual(info.format, 'jpeg');
    t.assert.strictEqual(info.width, 300);
    t.assert.ok(inRange(info.trimOffsetLeft, -873, -870));
    t.assert.strictEqual(info.trimOffsetTop, -554);
    await t.assert.doesNotReject(() => fixtures.assertSimilar(expected, data));
  });

  test('Single colour PNG where alpha channel provides the image', async (t) => {
    t.plan(7);
    const { data, info } = await sharp(fixtures.inputPngImageInAlpha)
      .trim()
      .toBuffer({ resolveWithObject: true });
    t.assert.ok(data.length > 0);
    t.assert.strictEqual(info.format, 'png');
    t.assert.strictEqual(info.width, 916);
    t.assert.strictEqual(info.height, 137);
    t.assert.strictEqual(info.channels, 4);
    t.assert.strictEqual(info.trimOffsetLeft, -6);
    t.assert.strictEqual(info.trimOffsetTop, -20);
  });

  test('16-bit PNG with alpha channel', async (t) => {
    t.plan(8);
    const { data, info } = await sharp(fixtures.inputPngWithTransparency16bit)
      .resize(32, 32)
      .trim({
        threshold: 20
      })
      .toBuffer({ resolveWithObject: true });
    t.assert.ok(data.length > 0);
    t.assert.strictEqual(info.format, 'png');
    t.assert.strictEqual(info.width, 32);
    t.assert.strictEqual(info.height, 32);
    t.assert.strictEqual(info.channels, 4);
    t.assert.strictEqual(info.trimOffsetLeft, -2);
    t.assert.strictEqual(info.trimOffsetTop, -2);
    await t.assert.doesNotReject(() => fixtures.assertSimilar(fixtures.expected('trim-16bit-rgba.png'), data));
  });

  test('Attempt to trim 2x2 pixel image fails', async (t) => {
    t.plan(1);
    await t.assert.rejects(() => sharp({
      create: {
        width: 2,
        height: 2,
        channels: 3,
        background: 'red'
      }
    })
      .trim()
      .toBuffer(),
    /Image to trim must be at least 3x3 pixels/
    );
  });

  test('Should rotate before trim', async (t) => {
    t.plan(4);
    const rotated30 = await sharp({
      create: {
        width: 20,
        height: 30,
        channels: 3,
        background: 'white'
      }
    })
      .rotate(30)
      .png()
      .toBuffer();
    const { info } = await sharp(rotated30)
      .rotate(-30)
      .trim({
        threshold: 128
      })
      .toBuffer({ resolveWithObject: true });
    t.assert.strictEqual(info.width, 20);
    t.assert.strictEqual(info.height, 31);
    t.assert.strictEqual(info.trimOffsetTop, -8);
    t.assert.strictEqual(info.trimOffsetLeft, -13);
  });

  test('Animated image rejects', async (t) => {
    t.plan(1);
    await t.assert.rejects(() => sharp(fixtures.inputGifAnimated, { animated: true })
      .trim()
      .toBuffer(),
    /Trim is not supported for multi-page images/
    );
  });

  test('Ensure trim uses bounding box of alpha and non-alpha channels', async (t) => {
    t.plan(4);
    const { info } = await sharp(fixtures.inputPngTrimIncludeAlpha)
      .trim()
      .toBuffer({ resolveWithObject: true });

    const { width, height, trimOffsetTop, trimOffsetLeft } = info;
    t.assert.strictEqual(width, 179);
    t.assert.strictEqual(height, 123);
    t.assert.strictEqual(trimOffsetTop, -44);
    t.assert.strictEqual(trimOffsetLeft, -13);
  });

  test('Ensure greyscale image can be trimmed', async (t) => {
    t.plan(4);
    const greyscale = await sharp({
      create: {
        width: 16,
        height: 8,
        channels: 3,
        background: 'silver'
      }
    })
      .extend({ left: 12, right: 24, background: 'gray' })
      .toColourspace('b-w')
      .png({ compressionLevel: 0 })
      .toBuffer();

    const { info } = await sharp(greyscale)
      .trim()
      .raw()
      .toBuffer({ resolveWithObject: true });

    const { width, height, trimOffsetTop, trimOffsetLeft } = info;
    t.assert.strictEqual(width, 16);
    t.assert.strictEqual(height, 8);
    t.assert.strictEqual(trimOffsetTop, 0);
    t.assert.strictEqual(trimOffsetLeft, -12);
  });

  test('Ensure CMYK image can be trimmed', async (t) => {
    t.plan(4);
    const cmyk = await sharp({
      create: {
        width: 16,
        height: 8,
        channels: 3,
        background: 'red'
      }
    })
      .extend({ left: 12, right: 24, background: 'blue' })
      .toColourspace('cmyk')
      .jpeg()
      .toBuffer();

    const { info } = await sharp(cmyk)
      .trim()
      .raw()
      .toBuffer({ resolveWithObject: true });

    const { width, height, trimOffsetTop, trimOffsetLeft } = info;
    t.assert.strictEqual(width, 16);
    t.assert.strictEqual(height, 8);
    t.assert.strictEqual(trimOffsetTop, 0);
    t.assert.strictEqual(trimOffsetLeft, -12);
  });

  test('Ensure trim of image with all pixels same is no-op', async (t) => {
    t.plan(4);
    const { info } = await sharp({
      create: {
        width: 5,
        height: 5,
        channels: 3,
        background: 'red'
      }
    })
      .trim()
      .toBuffer({ resolveWithObject: true });

    const { width, height, trimOffsetTop, trimOffsetLeft } = info;
    t.assert.strictEqual(width, 5);
    t.assert.strictEqual(height, 5);
    t.assert.strictEqual(trimOffsetTop, 0);
    t.assert.strictEqual(trimOffsetLeft, 0);
  });

  test('Works with line-art', async (t) => {
    t.plan(1);
    const { info } = await sharp(fixtures.inputJpgOverlayLayer2)
      .trim({ lineArt: true })
      .toBuffer({ resolveWithObject: true });

    t.assert.strictEqual(info.trimOffsetTop, -552);
  });

  suite('Invalid parameters', () => {
    Object.entries({
      'Invalid string': 'fail',
      'Invalid background option': {
        background: 'fail'
      },
      'Negative threshold option': {
        threshold: -1
      },
      'Invalid lineArt': {
        lineArt: 'fail'
      },
      'Invalid margin': {
        margin: -1
      }
    }).forEach(([description, parameter]) => {
      test(description, (t) => {
        t.plan(1);
        t.assert.throws(() => {
          sharp().trim(parameter);
        });
      });
    });
  });

  suite('Specific background colour', () => {
    test('Doesn\'t trim at all', async (t) => {
      t.plan(4);
      const { info } = await sharp(fixtures.inputPngTrimSpecificColour)
        .trim({
          background: 'yellow'
        })
        .toBuffer({ resolveWithObject: true });

      const { width, height, trimOffsetTop, trimOffsetLeft } = info;
      t.assert.strictEqual(width, 900);
      t.assert.strictEqual(height, 600);
      t.assert.strictEqual(trimOffsetTop, 0);
      t.assert.strictEqual(trimOffsetLeft, 0);
    });

    test('Only trims the bottom', async (t) => {
      t.plan(4);
      const { info } = await sharp(fixtures.inputPngTrimSpecificColour)
        .trim({
          background: '#21468B'
        })
        .toBuffer({ resolveWithObject: true });

      const { width, height, trimOffsetTop, trimOffsetLeft } = info;
      t.assert.strictEqual(width, 900);
      t.assert.strictEqual(height, 401);
      t.assert.strictEqual(trimOffsetTop, 0);
      t.assert.strictEqual(trimOffsetLeft, 0);
    });

    test('Only trims the bottom, in 16-bit', async (t) => {
      t.plan(4);
      const { info } = await sharp(fixtures.inputPngTrimSpecificColour16bit)
        .trim({
          background: '#21468B'
        })
        .toBuffer({ resolveWithObject: true });

      const { width, height, trimOffsetTop, trimOffsetLeft } = info;
      t.assert.strictEqual(width, 900);
      t.assert.strictEqual(height, 401);
      t.assert.strictEqual(trimOffsetTop, 0);
      t.assert.strictEqual(trimOffsetLeft, 0);
    });

    test('Only trims the bottom, including alpha', async (t) => {
      t.plan(4);
      const { info } = await sharp(fixtures.inputPngTrimSpecificColourIncludeAlpha)
        .trim({
          background: '#21468B80'
        })
        .toBuffer({ resolveWithObject: true });

      const { width, height, trimOffsetTop, trimOffsetLeft } = info;
      t.assert.strictEqual(width, 900);
      t.assert.strictEqual(height, 401);
      t.assert.strictEqual(trimOffsetTop, 0);
      t.assert.strictEqual(trimOffsetLeft, 0);
    });
  });

  suite('Adds margin around content', () => {
    test('Should trim complex gradients', async (t) => {
      t.plan(4);
      const { info } = await sharp(fixtures.inputPngGradients)
        .trim({ threshold: 50, margin: 100 })
        .toBuffer({ resolveWithObject: true });

      const { width, height, trimOffsetTop, trimOffsetLeft } = info;
      t.assert.strictEqual(width, 1000);
      t.assert.strictEqual(height, 443);
      t.assert.strictEqual(trimOffsetTop, -557);
      t.assert.strictEqual(trimOffsetLeft, 0);
    });

    test('Should trim simple gradients', async (t) => {
      t.plan(4);
      const { info } = await sharp(fixtures.inputPngWithSlightGradientBorder)
        .trim({ threshold: 70, margin: 50 })
        .toBuffer({ resolveWithObject: true });

      const { width, height, trimOffsetTop, trimOffsetLeft } = info;
      t.assert.strictEqual(width, 900);
      t.assert.strictEqual(height, 900);
      t.assert.strictEqual(trimOffsetTop, -50);
      t.assert.strictEqual(trimOffsetLeft, -50);
    });

    test('Should not overflow image bounding box', async (t) => {
      t.plan(4);
      const { info } = await sharp(fixtures.inputPngWithSlightGradientBorder)
        .trim({ threshold: 70, margin: 9999999 })
        .toBuffer({ resolveWithObject: true });

      const { width, height, trimOffsetTop, trimOffsetLeft } = info;
      t.assert.strictEqual(width, 1000);
      t.assert.strictEqual(height, 1000);
      t.assert.strictEqual(trimOffsetTop, 0);
      t.assert.strictEqual(trimOffsetLeft, 0);
    });
  });
});
