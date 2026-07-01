/*!
  Copyright 2013 Lovell Fuller and others.
  SPDX-License-Identifier: Apache-2.0
*/

import { suite, test } from 'node:test';

import sharp from '../../lib/index.js';
import fixtures from '../fixtures/index.js';

suite('Extend', () => {
  suite('extend all sides equally via a single value', () => {
    test('JPEG', async (t) => {
      t.plan(3);
      const { data, info } = await sharp(fixtures.inputJpg)
        .resize(120)
        .extend(10)
        .toBuffer({ resolveWithObject: true });
      t.assert.strictEqual(140, info.width);
      t.assert.strictEqual(118, info.height);
      await t.assert.doesNotReject(() => fixtures.assertSimilar(fixtures.expected('extend-equal-single.jpg'), data));
    });

    test('Animated WebP', async (t) => {
      t.plan(3);
      const { data, info } = await sharp(fixtures.inputWebPAnimated, { pages: -1 })
        .resize(120)
        .extend(10)
        .toBuffer({ resolveWithObject: true });
      t.assert.strictEqual(140, info.width);
      t.assert.strictEqual(140 * 9, info.height);
      await t.assert.doesNotReject(() => fixtures.assertSimilar(fixtures.expected('extend-equal-single.webp'), data));
    });
  });

  ['background', 'copy', 'mirror', 'repeat'].forEach(extendWith => {
    test(`extends all sides with animated WebP (${extendWith})`, async (t) => {
      t.plan(3);
      const { data, info } = await sharp(fixtures.inputWebPAnimated, { pages: -1 })
        .resize(120)
        .extend({
          extendWith,
          top: 40,
          bottom: 40,
          left: 40,
          right: 40
        })
        .toBuffer({ resolveWithObject: true });
      t.assert.strictEqual(200, info.width);
      t.assert.strictEqual(200 * 9, info.height);
      await t.assert.doesNotReject(() => fixtures.assertSimilar(fixtures.expected(`extend-equal-${extendWith}.webp`), data));
    });

    test(`extend all sides equally with RGB (${extendWith})`, async (t) => {
      t.plan(3);
      const { data, info } = await sharp(fixtures.inputJpg)
        .resize(120)
        .extend({
          extendWith,
          top: 10,
          bottom: 10,
          left: 10,
          right: 10,
          background: { r: 255, g: 0, b: 0 }
        })
        .toBuffer({ resolveWithObject: true });
      t.assert.strictEqual(140, info.width);
      t.assert.strictEqual(118, info.height);
      await t.assert.doesNotReject(() => fixtures.assertSimilar(fixtures.expected(`extend-equal-${extendWith}.jpg`), data));
    });

    test(`extend sides unequally with RGBA (${extendWith})`, async (t) => {
      t.plan(3);
      const { data, info } = await sharp(fixtures.inputPngWithTransparency16bit)
        .resize(120)
        .extend({
          extendWith,
          top: 50,
          left: 10,
          right: 35,
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .toBuffer({ resolveWithObject: true });
      t.assert.strictEqual(165, info.width);
      t.assert.strictEqual(170, info.height);
      await t.assert.doesNotReject(() => fixtures.assertSimilar(fixtures.expected(`extend-unequal-${extendWith}.png`), data));
    });

    test(`PNG with 2 channels (${extendWith})`, async (t) => {
      t.plan(6);
      const { data, info } = await sharp(fixtures.inputPngWithGreyAlpha)
        .extend({
          extendWith,
          top: 50,
          bottom: 50,
          left: 80,
          right: 80,
          background: 'transparent'
        })
        .toBuffer({ resolveWithObject: true });
      t.assert.strictEqual(true, data.length > 0);
      t.assert.strictEqual('png', info.format);
      t.assert.strictEqual(560, info.width);
      t.assert.strictEqual(400, info.height);
      t.assert.strictEqual(4, info.channels);
      await t.assert.doesNotReject(() => fixtures.assertSimilar(fixtures.expected(`extend-2channel-${extendWith}.png`), data));
    });
  });

  test('extend top with mirroring uses ordered read', async (t) => {
    t.plan(2);
    const data = await sharp(fixtures.inputJpg)
      .extend({
        extendWith: 'mirror',
        top: 1
      })
      .png({ compressionLevel: 0 })
      .toBuffer();

    const { width, height } = await sharp(data).metadata();
    t.assert.strictEqual(2725, width);
    t.assert.strictEqual(2226, height);
  });

  test('multi-page extend uses ordered read', async (t) => {
    t.plan(2);
    const multiPageTiff = await sharp(fixtures.inputGifAnimated, { animated: true })
      .resize({ width: 8, height: 48 })
      .tiff()
      .toBuffer();

    const data = await sharp(multiPageTiff, { pages: -1 })
      .extend({
        background: 'red',
        top: 1
      })
      .png({ compressionLevel: 0 })
      .toBuffer();

    const { width, height } = await sharp(data).metadata();
    t.assert.strictEqual(8, width);
    t.assert.strictEqual(1470, height);
  });

  test('missing parameter fails', (t) => {
    t.plan(1);
    t.assert.throws(() => {
      sharp().extend();
    });
  });
  test('negative fails', (t) => {
    t.plan(1);
    t.assert.throws(
      () => sharp().extend(-1),
      /Expected integer between 1 and 10000 for extend but received -1 of type number/
    );
  });
  test('too large fails', (t) => {
    t.plan(1);
    t.assert.throws(
      () => sharp().extend(10001),
      /Expected integer between 1 and 10000 for extend but received 10001 of type number/ 
    );
  });
  test('invalid top fails', (t) => {
    t.plan(3);
    t.assert.throws(
      () => sharp().extend({ top: 'fail' }),
      /Expected integer between 0 and 10000 for top but received fail of type string/
    );
    t.assert.throws(
      () => sharp().extend({ top: -1 }),
      /Expected integer between 0 and 10000 for top but received -1 of type number/
    );
    t.assert.throws(
      () => sharp().extend({ top: 10001 }),
      /Expected integer between 0 and 10000 for top but received 10001 of type number/
    );
  });
  test('invalid bottom fails', (t) => {
    t.plan(3);
    t.assert.throws(
      () => sharp().extend({ bottom: 'fail' }),
      /Expected integer between 0 and 10000 for bottom but received fail of type string/
    );
    t.assert.throws(
      () => sharp().extend({ bottom: -1 }),
      /Expected integer between 0 and 10000 for bottom but received -1 of type number/
    );
    t.assert.throws(
      () => sharp().extend({ bottom: 10001 }),
      /Expected integer between 0 and 10000 for bottom but received 10001 of type number/
    );
  });
  test('invalid left fails', (t) => {
    t.plan(3);
    t.assert.throws(
      () => sharp().extend({ left: 'fail' }),
      /Expected integer between 0 and 10000 for left but received fail of type string/
    );
    t.assert.throws(
      () => sharp().extend({ left: -1 }),
      /Expected integer between 0 and 10000 for left but received -1 of type number/
    );
    t.assert.throws(
      () => sharp().extend({ left: 10001 }),
      /Expected integer between 0 and 10000 for left but received 10001 of type number/
    );
  });
  test('invalid right fails', (t) => {
    t.plan(3);
    t.assert.throws(
      () => sharp().extend({ right: 'fail' }),
      /Expected integer between 0 and 10000 for right but received fail of type string/
    );
    t.assert.throws(
      () => sharp().extend({ right: -1 }),
      /Expected integer between 0 and 10000 for right but received -1 of type number/
    );
    t.assert.throws(
      () => sharp().extend({ right: 10001 }),
      /Expected integer between 0 and 10000 for right but received 10001 of type number/
    );
  });
  test('invalid extendWith fails', (t) => {
    t.plan(1);
    t.assert.throws(
      () => sharp().extend({ extendWith: 'invalid-value' }),
      /Expected one of: background, copy, repeat, mirror for extendWith but received invalid-value of type string/
    );
  });
  test('can set all edges apart from right', (t) => {
    t.plan(1);
    t.assert.doesNotThrow(() => sharp().extend({ top: 1, left: 2, bottom: 3 }));
  });

  test('should add alpha channel before extending with a transparent Background', async (t) => {
    t.plan(3);
    const { data, info } = await sharp(fixtures.inputJpgWithLandscapeExif1)
      .extend({
        bottom: 10,
        right: 10,
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .toFormat(sharp.format.png)
      .toBuffer({ resolveWithObject: true });
    t.assert.strictEqual(610, info.width);
    t.assert.strictEqual(460, info.height);
    await t.assert.doesNotReject(() => fixtures.assertSimilar(fixtures.expected('addAlphaChanelBeforeExtend.png'), data));
  });

  test('Premultiply background when compositing', async (t) => {
    t.plan(1);
    const background = { r: 191, g: 25, b: 66, alpha: 0.8 };
    const data = await sharp({
      create: {
        width: 1, height: 1, channels: 4, background: '#fff0'
      }
    })
      .composite([{
        input: {
          create: {
            width: 1, height: 1, channels: 4, background
          }
        }
      }])
      .extend({
        left: 1, background
      })
      .raw()
      .toBuffer();
    t.assert.deepStrictEqual(Array.from(data), [191, 25, 66, 204, 191, 25, 66, 204]);
  });
});
