/*!
  Copyright 2013 Lovell Fuller and others.
  SPDX-License-Identifier: Apache-2.0
*/

import { suite, test } from 'node:test';

import sharp from '../../lib/index.js';
import fixtures from '../fixtures/index.js';

suite('Resize fit=contain', () => {
  test('Allows specifying the position as a string', async (t) => {
    t.plan(3);
    const { data, info } = await sharp(fixtures.inputJpg)
      .resize(320, 240, {
        fit: 'contain',
        position: 'center'
      })
      .png()
      .toBuffer({ resolveWithObject: true });
    t.assert.strictEqual(320, info.width);
    t.assert.strictEqual(240, info.height);
    await t.assert.doesNotReject(() => fixtures.assertSimilar(fixtures.expected('embed-3-into-3.png'), data));
  });

  test('JPEG within PNG, no alpha channel', async (t) => {
    t.plan(6);
    const { data, info } = await sharp(fixtures.inputJpg)
      .resize(320, 240, { fit: 'contain' })
      .png()
      .toBuffer({ resolveWithObject: true });
    t.assert.strictEqual(true, data.length > 0);
    t.assert.strictEqual('png', info.format);
    t.assert.strictEqual(320, info.width);
    t.assert.strictEqual(240, info.height);
    t.assert.strictEqual(3, info.channels);
    await t.assert.doesNotReject(() => fixtures.assertSimilar(fixtures.expected('embed-3-into-3.png'), data));
  });

  test('JPEG within WebP, to include alpha channel', async (t) => {
    t.plan(6);
    const { data, info } = await sharp(fixtures.inputJpg)
      .resize(320, 240, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .webp()
      .toBuffer({ resolveWithObject: true });
    t.assert.strictEqual(true, data.length > 0);
    t.assert.strictEqual('webp', info.format);
    t.assert.strictEqual(320, info.width);
    t.assert.strictEqual(240, info.height);
    t.assert.strictEqual(4, info.channels);
    await t.assert.doesNotReject(() => fixtures.assertSimilar(fixtures.expected('embed-3-into-4.webp'), data));
  });

  test('PNG with alpha channel', async (t) => {
    t.plan(6);
    const { data, info } = await sharp(fixtures.inputPngWithTransparency)
      .resize(50, 50, { fit: 'contain' })
      .toBuffer({ resolveWithObject: true });
    t.assert.strictEqual(true, data.length > 0);
    t.assert.strictEqual('png', info.format);
    t.assert.strictEqual(50, info.width);
    t.assert.strictEqual(50, info.height);
    t.assert.strictEqual(4, info.channels);
    await t.assert.doesNotReject(() => fixtures.assertSimilar(fixtures.expected('embed-4-into-4.png'), data));
  });

  test('16-bit PNG with alpha channel', async (t) => {
    t.plan(6);
    const { data, info } = await sharp(fixtures.inputPngWithTransparency16bit)
      .resize(32, 16, { fit: 'contain' })
      .toBuffer({ resolveWithObject: true });
    t.assert.strictEqual(true, data.length > 0);
    t.assert.strictEqual('png', info.format);
    t.assert.strictEqual(32, info.width);
    t.assert.strictEqual(16, info.height);
    t.assert.strictEqual(4, info.channels);
    await t.assert.doesNotReject(() => fixtures.assertSimilar(fixtures.expected('embed-16bit.png'), data));
  });

  test('16-bit PNG with alpha channel onto RGBA', async (t) => {
    t.plan(6);
    const { data, info } = await sharp(fixtures.inputPngWithTransparency16bit)
      .resize(32, 16, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .toBuffer({ resolveWithObject: true });
    t.assert.strictEqual(true, data.length > 0);
    t.assert.strictEqual('png', info.format);
    t.assert.strictEqual(32, info.width);
    t.assert.strictEqual(16, info.height);
    t.assert.strictEqual(4, info.channels);
    await t.assert.doesNotReject(() => fixtures.assertSimilar(fixtures.expected('embed-16bit-rgba.png'), data));
  });

  test('PNG with 2 channels', async (t) => {
    t.plan(6);
    const { data, info } = await sharp(fixtures.inputPngWithGreyAlpha)
      .resize(32, 16, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .toBuffer({ resolveWithObject: true });
    t.assert.strictEqual(true, data.length > 0);
    t.assert.strictEqual('png', info.format);
    t.assert.strictEqual(32, info.width);
    t.assert.strictEqual(16, info.height);
    t.assert.strictEqual(4, info.channels);
    await t.assert.doesNotReject(() => fixtures.assertSimilar(fixtures.expected('embed-2channel.png'), data));
  });

  test('TIFF in LAB colourspace onto RGBA background', async (t) => {
    t.plan(6);
    const { data, info } = await sharp(fixtures.inputTiffCielab)
      .resize(64, 128, {
        fit: 'contain',
        background: { r: 255, g: 102, b: 0, alpha: 0.5 }
      })
      .png()
      .toBuffer({ resolveWithObject: true });
    t.assert.strictEqual(true, data.length > 0);
    t.assert.strictEqual('png', info.format);
    t.assert.strictEqual(64, info.width);
    t.assert.strictEqual(128, info.height);
    t.assert.strictEqual(4, info.channels);
    await t.assert.doesNotReject(() => fixtures.assertSimilar(fixtures.expected('embed-lab-into-rgba.png'), data));
  });

  test('Enlarge', async (t) => {
    t.plan(6);
    const { data, info } = await sharp(fixtures.inputPngWithOneColor)
      .resize(320, 240, { fit: 'contain' })
      .toBuffer({ resolveWithObject: true });
    t.assert.strictEqual(true, data.length > 0);
    t.assert.strictEqual('png', info.format);
    t.assert.strictEqual(320, info.width);
    t.assert.strictEqual(240, info.height);
    t.assert.strictEqual(3, info.channels);
    await t.assert.doesNotReject(() => fixtures.assertSimilar(fixtures.expected('embed-enlarge.png'), data));
  });

  suite('Animated WebP', () => {
    test('Width only', async (t) => {
      t.plan(6);
      const { data, info } = await sharp(fixtures.inputWebPAnimated, { pages: -1 })
        .resize(320, 240, {
          fit: 'contain',
          background: { r: 255, g: 0, b: 0 }
        })
        .toBuffer({ resolveWithObject: true });
      t.assert.strictEqual(true, data.length > 0);
      t.assert.strictEqual('webp', info.format);
      t.assert.strictEqual(320, info.width);
      t.assert.strictEqual(240 * 9, info.height);
      t.assert.strictEqual(4, info.channels);
      await t.assert.doesNotReject(() => fixtures.assertSimilar(fixtures.expected('embed-animated-width.webp'), data));
    });

    test('Height only', async (t) => {
      t.plan(6);
      const { data, info } = await sharp(fixtures.inputWebPAnimated, { pages: -1 })
        .resize(240, 320, {
          fit: 'contain',
          background: { r: 255, g: 0, b: 0 }
        })
        .toBuffer({ resolveWithObject: true });
      t.assert.strictEqual(true, data.length > 0);
      t.assert.strictEqual('webp', info.format);
      t.assert.strictEqual(240, info.width);
      t.assert.strictEqual(320 * 9, info.height);
      t.assert.strictEqual(4, info.channels);
      await t.assert.doesNotReject(() => fixtures.assertSimilar(fixtures.expected('embed-animated-height.webp'), data));
    });
  });

  test('Invalid position values should fail', (t) => {
    t.plan(6);
    [-1, 8.1, 9, 1000000, false, 'vallejo'].forEach((position) => {
      t.assert.throws(() => {
        sharp().resize(null, null, { fit: 'contain', position });
      });
    });
  });

  test('Position horizontal top', async (t) => {
    t.plan(6);
    const { data, info } = await sharp(fixtures.inputPngEmbed)
      .resize(200, 100, {
        fit: sharp.fit.contain,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
        position: 'top'
      })
      .toBuffer({ resolveWithObject: true });
    t.assert.strictEqual(true, data.length > 0);
    t.assert.strictEqual('png', info.format);
    t.assert.strictEqual(200, info.width);
    t.assert.strictEqual(100, info.height);
    t.assert.strictEqual(4, info.channels);
    await t.assert.doesNotReject(() => fixtures.assertSimilar(fixtures.expected('./embedgravitybird/a2-n.png'), data));
  });

  test('Position horizontal right top', async (t) => {
    t.plan(6);
    const { data, info } = await sharp(fixtures.inputPngEmbed)
      .resize(200, 100, {
        fit: sharp.fit.contain,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
        position: 'right top'
      })
      .toBuffer({ resolveWithObject: true });
    t.assert.strictEqual(true, data.length > 0);
    t.assert.strictEqual('png', info.format);
    t.assert.strictEqual(200, info.width);
    t.assert.strictEqual(100, info.height);
    t.assert.strictEqual(4, info.channels);
    await t.assert.doesNotReject(() => fixtures.assertSimilar(fixtures.expected('./embedgravitybird/a3-ne.png'), data));
  });

  test('Position horizontal right', async (t) => {
    t.plan(6);
    const { data, info } = await sharp(fixtures.inputPngEmbed)
      .resize(200, 100, {
        fit: sharp.fit.contain,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
        position: 'right'
      })
      .toBuffer({ resolveWithObject: true });
    t.assert.strictEqual(true, data.length > 0);
    t.assert.strictEqual('png', info.format);
    t.assert.strictEqual(200, info.width);
    t.assert.strictEqual(100, info.height);
    t.assert.strictEqual(4, info.channels);
    await t.assert.doesNotReject(() => fixtures.assertSimilar(fixtures.expected('./embedgravitybird/a4-e.png'), data));
  });

  test('Position horizontal right bottom', async (t) => {
    t.plan(6);
    const { data, info } = await sharp(fixtures.inputPngEmbed)
      .resize(200, 100, {
        fit: sharp.fit.contain,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
        position: 'right bottom'
      })
      .toBuffer({ resolveWithObject: true });
    t.assert.strictEqual(true, data.length > 0);
    t.assert.strictEqual('png', info.format);
    t.assert.strictEqual(200, info.width);
    t.assert.strictEqual(100, info.height);
    t.assert.strictEqual(4, info.channels);
    await t.assert.doesNotReject(() => fixtures.assertSimilar(fixtures.expected('./embedgravitybird/a5-se.png'), data));
  });

  test('Position horizontal bottom', async (t) => {
    t.plan(6);
    const { data, info } = await sharp(fixtures.inputPngEmbed)
      .resize(200, 100, {
        fit: sharp.fit.contain,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
        position: 'bottom'
      })
      .toBuffer({ resolveWithObject: true });
    t.assert.strictEqual(true, data.length > 0);
    t.assert.strictEqual('png', info.format);
    t.assert.strictEqual(200, info.width);
    t.assert.strictEqual(100, info.height);
    t.assert.strictEqual(4, info.channels);
    await t.assert.doesNotReject(() => fixtures.assertSimilar(fixtures.expected('./embedgravitybird/a6-s.png'), data));
  });

  test('Position horizontal left bottom', async (t) => {
    t.plan(6);
    const { data, info } = await sharp(fixtures.inputPngEmbed)
      .resize(200, 100, {
        fit: sharp.fit.contain,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
        position: 'left bottom'
      })
      .toBuffer({ resolveWithObject: true });
    t.assert.strictEqual(true, data.length > 0);
    t.assert.strictEqual('png', info.format);
    t.assert.strictEqual(200, info.width);
    t.assert.strictEqual(100, info.height);
    t.assert.strictEqual(4, info.channels);
    await t.assert.doesNotReject(() => fixtures.assertSimilar(fixtures.expected('./embedgravitybird/a7-sw.png'), data));
  });

  test('Position horizontal left', async (t) => {
    t.plan(6);
    const { data, info } = await sharp(fixtures.inputPngEmbed)
      .resize(200, 100, {
        fit: sharp.fit.contain,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
        position: 'left'
      })
      .toBuffer({ resolveWithObject: true });
    t.assert.strictEqual(true, data.length > 0);
    t.assert.strictEqual('png', info.format);
    t.assert.strictEqual(200, info.width);
    t.assert.strictEqual(100, info.height);
    t.assert.strictEqual(4, info.channels);
    await t.assert.doesNotReject(() => fixtures.assertSimilar(fixtures.expected('./embedgravitybird/a8-w.png'), data));
  });

  test('Position horizontal left top', async (t) => {
    t.plan(6);
    const { data, info } = await sharp(fixtures.inputPngEmbed)
      .resize(200, 100, {
        fit: sharp.fit.contain,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
        position: 'left top'
      })
      .toBuffer({ resolveWithObject: true });
    t.assert.strictEqual(true, data.length > 0);
    t.assert.strictEqual('png', info.format);
    t.assert.strictEqual(200, info.width);
    t.assert.strictEqual(100, info.height);
    t.assert.strictEqual(4, info.channels);
    await t.assert.doesNotReject(() => fixtures.assertSimilar(fixtures.expected('./embedgravitybird/a1-nw.png'), data));
  });

  test('Position horizontal north', async (t) => {
    t.plan(6);
    const { data, info } = await sharp(fixtures.inputPngEmbed)
      .resize(200, 100, {
        fit: sharp.fit.contain,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
        position: sharp.gravity.north
      })
      .toBuffer({ resolveWithObject: true });
    t.assert.strictEqual(true, data.length > 0);
    t.assert.strictEqual('png', info.format);
    t.assert.strictEqual(200, info.width);
    t.assert.strictEqual(100, info.height);
    t.assert.strictEqual(4, info.channels);
    await t.assert.doesNotReject(() => fixtures.assertSimilar(fixtures.expected('./embedgravitybird/a2-n.png'), data));
  });

  test('Position horizontal northeast', async (t) => {
    t.plan(6);
    const { data, info } = await sharp(fixtures.inputPngEmbed)
      .resize(200, 100, {
        fit: sharp.fit.contain,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
        position: sharp.gravity.northeast
      })
      .toBuffer({ resolveWithObject: true });
    t.assert.strictEqual(true, data.length > 0);
    t.assert.strictEqual('png', info.format);
    t.assert.strictEqual(200, info.width);
    t.assert.strictEqual(100, info.height);
    t.assert.strictEqual(4, info.channels);
    await t.assert.doesNotReject(() => fixtures.assertSimilar(fixtures.expected('./embedgravitybird/a3-ne.png'), data));
  });

  test('Position horizontal east', async (t) => {
    t.plan(6);
    const { data, info } = await sharp(fixtures.inputPngEmbed)
      .resize(200, 100, {
        fit: sharp.fit.contain,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
        position: sharp.gravity.east
      })
      .toBuffer({ resolveWithObject: true });
    t.assert.strictEqual(true, data.length > 0);
    t.assert.strictEqual('png', info.format);
    t.assert.strictEqual(200, info.width);
    t.assert.strictEqual(100, info.height);
    t.assert.strictEqual(4, info.channels);
    await t.assert.doesNotReject(() => fixtures.assertSimilar(fixtures.expected('./embedgravitybird/a4-e.png'), data));
  });

  test('Position horizontal southeast', async (t) => {
    t.plan(6);
    const { data, info } = await sharp(fixtures.inputPngEmbed)
      .resize(200, 100, {
        fit: sharp.fit.contain,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
        position: sharp.gravity.southeast
      })
      .toBuffer({ resolveWithObject: true });
    t.assert.strictEqual(true, data.length > 0);
    t.assert.strictEqual('png', info.format);
    t.assert.strictEqual(200, info.width);
    t.assert.strictEqual(100, info.height);
    t.assert.strictEqual(4, info.channels);
    await t.assert.doesNotReject(() => fixtures.assertSimilar(fixtures.expected('./embedgravitybird/a5-se.png'), data));
  });

  test('Position horizontal south', async (t) => {
    t.plan(6);
    const { data, info } = await sharp(fixtures.inputPngEmbed)
      .resize(200, 100, {
        fit: sharp.fit.contain,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
        position: sharp.gravity.south
      })
      .toBuffer({ resolveWithObject: true });
    t.assert.strictEqual(true, data.length > 0);
    t.assert.strictEqual('png', info.format);
    t.assert.strictEqual(200, info.width);
    t.assert.strictEqual(100, info.height);
    t.assert.strictEqual(4, info.channels);
    await t.assert.doesNotReject(() => fixtures.assertSimilar(fixtures.expected('./embedgravitybird/a6-s.png'), data));
  });

  test('Position horizontal southwest', async (t) => {
    t.plan(6);
    const { data, info } = await sharp(fixtures.inputPngEmbed)
      .resize(200, 100, {
        fit: sharp.fit.contain,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
        position: sharp.gravity.southwest
      })
      .toBuffer({ resolveWithObject: true });
    t.assert.strictEqual(true, data.length > 0);
    t.assert.strictEqual('png', info.format);
    t.assert.strictEqual(200, info.width);
    t.assert.strictEqual(100, info.height);
    t.assert.strictEqual(4, info.channels);
    await t.assert.doesNotReject(() => fixtures.assertSimilar(fixtures.expected('./embedgravitybird/a7-sw.png'), data));
  });

  test('Position horizontal west', async (t) => {
    t.plan(6);
    const { data, info } = await sharp(fixtures.inputPngEmbed)
      .resize(200, 100, {
        fit: sharp.fit.contain,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
        position: sharp.gravity.west
      })
      .toBuffer({ resolveWithObject: true });
    t.assert.strictEqual(true, data.length > 0);
    t.assert.strictEqual('png', info.format);
    t.assert.strictEqual(200, info.width);
    t.assert.strictEqual(100, info.height);
    t.assert.strictEqual(4, info.channels);
    await t.assert.doesNotReject(() => fixtures.assertSimilar(fixtures.expected('./embedgravitybird/a8-w.png'), data));
  });

  test('Position horizontal northwest', async (t) => {
    t.plan(6);
    const { data, info } = await sharp(fixtures.inputPngEmbed)
      .resize(200, 100, {
        fit: sharp.fit.contain,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
        position: sharp.gravity.northwest
      })
      .toBuffer({ resolveWithObject: true });
    t.assert.strictEqual(true, data.length > 0);
    t.assert.strictEqual('png', info.format);
    t.assert.strictEqual(200, info.width);
    t.assert.strictEqual(100, info.height);
    t.assert.strictEqual(4, info.channels);
    await t.assert.doesNotReject(() => fixtures.assertSimilar(fixtures.expected('./embedgravitybird/a1-nw.png'), data));
  });

  test('Position horizontal center', async (t) => {
    t.plan(6);
    const { data, info } = await sharp(fixtures.inputPngEmbed)
      .resize(200, 100, {
        fit: sharp.fit.contain,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
        position: sharp.gravity.center
      })
      .toBuffer({ resolveWithObject: true });
    t.assert.strictEqual(true, data.length > 0);
    t.assert.strictEqual('png', info.format);
    t.assert.strictEqual(200, info.width);
    t.assert.strictEqual(100, info.height);
    t.assert.strictEqual(4, info.channels);
    await t.assert.doesNotReject(() => fixtures.assertSimilar(fixtures.expected('./embedgravitybird/a9-c.png'), data));
  });

  test('Position vertical top', async (t) => {
    t.plan(6);
    const { data, info } = await sharp(fixtures.inputPngEmbed)
      .resize(200, 200, {
        fit: sharp.fit.contain,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
        position: 'top'
      })
      .toBuffer({ resolveWithObject: true });
    t.assert.strictEqual(true, data.length > 0);
    t.assert.strictEqual('png', info.format);
    t.assert.strictEqual(200, info.width);
    t.assert.strictEqual(200, info.height);
    t.assert.strictEqual(4, info.channels);
    await t.assert.doesNotReject(() => fixtures.assertSimilar(fixtures.expected('./embedgravitybird/2-n.png'), data));
  });

  test('Position vertical right top', async (t) => {
    t.plan(6);
    const { data, info } = await sharp(fixtures.inputPngEmbed)
      .resize(200, 200, {
        fit: sharp.fit.contain,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
        position: 'right top'
      })
      .toBuffer({ resolveWithObject: true });
    t.assert.strictEqual(true, data.length > 0);
    t.assert.strictEqual('png', info.format);
    t.assert.strictEqual(200, info.width);
    t.assert.strictEqual(200, info.height);
    t.assert.strictEqual(4, info.channels);
    await t.assert.doesNotReject(() => fixtures.assertSimilar(fixtures.expected('./embedgravitybird/3-ne.png'), data));
  });

  test('Position vertical right', async (t) => {
    t.plan(6);
    const { data, info } = await sharp(fixtures.inputPngEmbed)
      .resize(200, 200, {
        fit: sharp.fit.contain,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
        position: 'right'
      })
      .toBuffer({ resolveWithObject: true });
    t.assert.strictEqual(true, data.length > 0);
    t.assert.strictEqual('png', info.format);
    t.assert.strictEqual(200, info.width);
    t.assert.strictEqual(200, info.height);
    t.assert.strictEqual(4, info.channels);
    await t.assert.doesNotReject(() => fixtures.assertSimilar(fixtures.expected('./embedgravitybird/4-e.png'), data));
  });

  test('Position vertical right bottom', async (t) => {
    t.plan(6);
    const { data, info } = await sharp(fixtures.inputPngEmbed)
      .resize(200, 200, {
        fit: sharp.fit.contain,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
        position: 'right bottom'
      })
      .toBuffer({ resolveWithObject: true });
    t.assert.strictEqual(true, data.length > 0);
    t.assert.strictEqual('png', info.format);
    t.assert.strictEqual(200, info.width);
    t.assert.strictEqual(200, info.height);
    t.assert.strictEqual(4, info.channels);
    await t.assert.doesNotReject(() => fixtures.assertSimilar(fixtures.expected('./embedgravitybird/5-se.png'), data));
  });

  test('Position vertical bottom', async (t) => {
    t.plan(6);
    const { data, info } = await sharp(fixtures.inputPngEmbed)
      .resize(200, 200, {
        fit: sharp.fit.contain,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
        position: 'bottom'
      })
      .toBuffer({ resolveWithObject: true });
    t.assert.strictEqual(true, data.length > 0);
    t.assert.strictEqual('png', info.format);
    t.assert.strictEqual(200, info.width);
    t.assert.strictEqual(200, info.height);
    t.assert.strictEqual(4, info.channels);
    await t.assert.doesNotReject(() => fixtures.assertSimilar(fixtures.expected('./embedgravitybird/6-s.png'), data));
  });

  test('Position vertical left bottom', async (t) => {
    t.plan(6);
    const { data, info } = await sharp(fixtures.inputPngEmbed)
      .resize(200, 200, {
        fit: sharp.fit.contain,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
        position: 'left bottom'
      })
      .toBuffer({ resolveWithObject: true });
    t.assert.strictEqual(true, data.length > 0);
    t.assert.strictEqual('png', info.format);
    t.assert.strictEqual(200, info.width);
    t.assert.strictEqual(200, info.height);
    t.assert.strictEqual(4, info.channels);
    await t.assert.doesNotReject(() => fixtures.assertSimilar(fixtures.expected('./embedgravitybird/7-sw.png'), data));
  });

  test('Position vertical left', async (t) => {
    t.plan(6);
    const { data, info } = await sharp(fixtures.inputPngEmbed)
      .resize(200, 200, {
        fit: sharp.fit.contain,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
        position: 'left'
      })
      .toBuffer({ resolveWithObject: true });
    t.assert.strictEqual(true, data.length > 0);
    t.assert.strictEqual('png', info.format);
    t.assert.strictEqual(200, info.width);
    t.assert.strictEqual(200, info.height);
    t.assert.strictEqual(4, info.channels);
    await t.assert.doesNotReject(() => fixtures.assertSimilar(fixtures.expected('./embedgravitybird/8-w.png'), data));
  });

  test('Position vertical left top', async (t) => {
    t.plan(6);
    const { data, info } = await sharp(fixtures.inputPngEmbed)
      .resize(200, 200, {
        fit: sharp.fit.contain,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
        position: 'left top'
      })
      .toBuffer({ resolveWithObject: true });
    t.assert.strictEqual(true, data.length > 0);
    t.assert.strictEqual('png', info.format);
    t.assert.strictEqual(200, info.width);
    t.assert.strictEqual(200, info.height);
    t.assert.strictEqual(4, info.channels);
    await t.assert.doesNotReject(() => fixtures.assertSimilar(fixtures.expected('./embedgravitybird/1-nw.png'), data));
  });

  test('Position vertical north', async (t) => {
    t.plan(6);
    const { data, info } = await sharp(fixtures.inputPngEmbed)
      .resize(200, 200, {
        fit: sharp.fit.contain,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
        position: sharp.gravity.north
      })
      .toBuffer({ resolveWithObject: true });
    t.assert.strictEqual(true, data.length > 0);
    t.assert.strictEqual('png', info.format);
    t.assert.strictEqual(200, info.width);
    t.assert.strictEqual(200, info.height);
    t.assert.strictEqual(4, info.channels);
    await t.assert.doesNotReject(() => fixtures.assertSimilar(fixtures.expected('./embedgravitybird/2-n.png'), data));
  });

  test('Position vertical northeast', async (t) => {
    t.plan(6);
    const { data, info } = await sharp(fixtures.inputPngEmbed)
      .resize(200, 200, {
        fit: sharp.fit.contain,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
        position: sharp.gravity.northeast
      })
      .toBuffer({ resolveWithObject: true });
    t.assert.strictEqual(true, data.length > 0);
    t.assert.strictEqual('png', info.format);
    t.assert.strictEqual(200, info.width);
    t.assert.strictEqual(200, info.height);
    t.assert.strictEqual(4, info.channels);
    await t.assert.doesNotReject(() => fixtures.assertSimilar(fixtures.expected('./embedgravitybird/3-ne.png'), data));
  });

  test('Position vertical east', async (t) => {
    t.plan(6);
    const { data, info } = await sharp(fixtures.inputPngEmbed)
      .resize(200, 200, {
        fit: sharp.fit.contain,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
        position: sharp.gravity.east
      })
      .toBuffer({ resolveWithObject: true });
    t.assert.strictEqual(true, data.length > 0);
    t.assert.strictEqual('png', info.format);
    t.assert.strictEqual(200, info.width);
    t.assert.strictEqual(200, info.height);
    t.assert.strictEqual(4, info.channels);
    await t.assert.doesNotReject(() => fixtures.assertSimilar(fixtures.expected('./embedgravitybird/4-e.png'), data));
  });

  test('Position vertical southeast', async (t) => {
    t.plan(6);
    const { data, info } = await sharp(fixtures.inputPngEmbed)
      .resize(200, 200, {
        fit: sharp.fit.contain,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
        position: sharp.gravity.southeast
      })
      .toBuffer({ resolveWithObject: true });
    t.assert.strictEqual(true, data.length > 0);
    t.assert.strictEqual('png', info.format);
    t.assert.strictEqual(200, info.width);
    t.assert.strictEqual(200, info.height);
    t.assert.strictEqual(4, info.channels);
    await t.assert.doesNotReject(() => fixtures.assertSimilar(fixtures.expected('./embedgravitybird/5-se.png'), data));
  });

  test('Position vertical south', async (t) => {
    t.plan(6);
    const { data, info } = await sharp(fixtures.inputPngEmbed)
      .resize(200, 200, {
        fit: sharp.fit.contain,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
        position: sharp.gravity.south
      })
      .toBuffer({ resolveWithObject: true });
    t.assert.strictEqual(true, data.length > 0);
    t.assert.strictEqual('png', info.format);
    t.assert.strictEqual(200, info.width);
    t.assert.strictEqual(200, info.height);
    t.assert.strictEqual(4, info.channels);
    await t.assert.doesNotReject(() => fixtures.assertSimilar(fixtures.expected('./embedgravitybird/6-s.png'), data));
  });

  test('Position vertical southwest', async (t) => {
    t.plan(6);
    const { data, info } = await sharp(fixtures.inputPngEmbed)
      .resize(200, 200, {
        fit: sharp.fit.contain,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
        position: sharp.gravity.southwest
      })
      .toBuffer({ resolveWithObject: true });
    t.assert.strictEqual(true, data.length > 0);
    t.assert.strictEqual('png', info.format);
    t.assert.strictEqual(200, info.width);
    t.assert.strictEqual(200, info.height);
    t.assert.strictEqual(4, info.channels);
    await t.assert.doesNotReject(() => fixtures.assertSimilar(fixtures.expected('./embedgravitybird/7-sw.png'), data));
  });

  test('Position vertical west', async (t) => {
    t.plan(6);
    const { data, info } = await sharp(fixtures.inputPngEmbed)
      .resize(200, 200, {
        fit: sharp.fit.contain,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
        position: sharp.gravity.west
      })
      .toBuffer({ resolveWithObject: true });
    t.assert.strictEqual(true, data.length > 0);
    t.assert.strictEqual('png', info.format);
    t.assert.strictEqual(200, info.width);
    t.assert.strictEqual(200, info.height);
    t.assert.strictEqual(4, info.channels);
    await t.assert.doesNotReject(() => fixtures.assertSimilar(fixtures.expected('./embedgravitybird/8-w.png'), data));
  });

  test('Position vertical northwest', async (t) => {
    t.plan(6);
    const { data, info } = await sharp(fixtures.inputPngEmbed)
      .resize(200, 200, {
        fit: sharp.fit.contain,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
        position: sharp.gravity.northwest
      })
      .toBuffer({ resolveWithObject: true });
    t.assert.strictEqual(true, data.length > 0);
    t.assert.strictEqual('png', info.format);
    t.assert.strictEqual(200, info.width);
    t.assert.strictEqual(200, info.height);
    t.assert.strictEqual(4, info.channels);
    await t.assert.doesNotReject(() => fixtures.assertSimilar(fixtures.expected('./embedgravitybird/1-nw.png'), data));
  });

  test('Position vertical center', async (t) => {
    t.plan(6);
    const { data, info } = await sharp(fixtures.inputPngEmbed)
      .resize(200, 200, {
        fit: sharp.fit.contain,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
        position: sharp.gravity.center
      })
      .toBuffer({ resolveWithObject: true });
    t.assert.strictEqual(true, data.length > 0);
    t.assert.strictEqual('png', info.format);
    t.assert.strictEqual(200, info.width);
    t.assert.strictEqual(200, info.height);
    t.assert.strictEqual(4, info.channels);
    await t.assert.doesNotReject(() => fixtures.assertSimilar(fixtures.expected('./embedgravitybird/9-c.png'), data));
  });

  test('multiple alpha channels', async (t) => {
    t.plan(5);
    const create = {
      width: 20,
      height: 12,
      channels: 4,
      background: 'green'
    };
    const multipleAlphaChannels = await sharp({ create })
      .joinChannel({ create })
      .tiff({ compression: 'deflate' })
      .toBuffer();

    const options = { limitInputChannels: 8 };
    const data = await sharp(multipleAlphaChannels, options)
      .resize({
        width: 8,
        height: 8,
        fit: 'contain',
        background: 'blue'
      })
      .tiff({ compression: 'deflate' })
      .toBuffer();
    const { format, width, height, space, channels } = await sharp(data, options).metadata();
    t.assert.deepStrictEqual(format, 'tiff');
    t.assert.deepStrictEqual(width, 8);
    t.assert.deepStrictEqual(height, 8);
    t.assert.deepStrictEqual(space, 'srgb');
    t.assert.deepStrictEqual(channels, 8);
  });
});
