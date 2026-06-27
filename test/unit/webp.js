/*!
  Copyright 2013 Lovell Fuller and others.
  SPDX-License-Identifier: Apache-2.0
*/

const fs = require('node:fs/promises');
const { suite, test } = require('node:test');

const sharp = require('../../');
const fixtures = require('../fixtures');

suite('WebP', () => {
  test('WebP output', async (t) => {
    t.plan(4);
    const { data, info } = await sharp(fixtures.inputJpg)
      .resize(320, 240)
      .toFormat(sharp.format.webp)
      .toBuffer({ resolveWithObject: true });
    t.assert.strictEqual(true, data.length > 0);
    t.assert.strictEqual('webp', info.format);
    t.assert.strictEqual(320, info.width);
    t.assert.strictEqual(240, info.height);
  });

  test('Invalid WebP quality throws error', (t) => {
    t.plan(1);
    t.assert.throws(() => {
      sharp().webp({ quality: 101 });
    });
  });

  test('Invalid WebP alpha quality throws error', (t) => {
    t.plan(1);
    t.assert.throws(() => {
      sharp().webp({ alphaQuality: 101 });
    });
  });

  test('should work for webp alpha quality', async (t) => {
    t.plan(3);
    const { data, info } = await sharp(fixtures.inputPngAlphaPremultiplicationSmall)
      .webp({ alphaQuality: 80, effort: 0 })
      .toBuffer({ resolveWithObject: true });
    t.assert.strictEqual(true, data.length > 0);
    t.assert.strictEqual('webp', info.format);
    await t.assert.doesNotReject(() => fixtures.assertSimilar(fixtures.expected('webp-alpha-80.webp'), data));
  });

  test('should work for webp lossless', async (t) => {
    t.plan(3);
    const { data, info } = await sharp(fixtures.inputPngAlphaPremultiplicationSmall)
      .webp({ lossless: true, effort: 0 })
      .toBuffer({ resolveWithObject: true });
    t.assert.strictEqual(true, data.length > 0);
    t.assert.strictEqual('webp', info.format);
    await t.assert.doesNotReject(() => fixtures.assertSimilar(fixtures.expected('webp-lossless.webp'), data));
  });

  test('should work for webp near-lossless', async (t) => {
    t.plan(3);
    const { data, info } = await sharp(fixtures.inputPngAlphaPremultiplicationSmall)
      .webp({ nearLossless: true, quality: 50, effort: 0 })
      .toBuffer({ resolveWithObject: true });
    t.assert.strictEqual(true, data.length > 0);
    t.assert.strictEqual('webp', info.format);
    await t.assert.doesNotReject(() => fixtures.assertSimilar(fixtures.expected('webp-near-lossless-50.webp'), data));
  });

  test('should use near-lossless when both lossless and nearLossless are specified', async (t) => {
    t.plan(3);
    const { data, info } = await sharp(fixtures.inputPngAlphaPremultiplicationSmall)
      .webp({ nearLossless: true, quality: 50, lossless: true, effort: 0 })
      .toBuffer({ resolveWithObject: true });
    t.assert.strictEqual(true, data.length > 0);
    t.assert.strictEqual('webp', info.format);
    await t.assert.doesNotReject(() => fixtures.assertSimilar(fixtures.expected('webp-near-lossless-50.webp'), data));
  });

  test('should produce a larger file size using smartSubsample', async (t) => {
    t.plan(1);
    const withoutSmartSubsample = await sharp(fixtures.inputJpg)
      .resize(320, 240)
      .webp({ smartSubsample: false })
      .toBuffer();
    const withSmartSubsample = await sharp(fixtures.inputJpg)
      .resize(320, 240)
      .webp({ smartSubsample: true })
      .toBuffer();
    t.assert.strictEqual(true, withSmartSubsample.length > withoutSmartSubsample.length);
  });

  test('invalid smartSubsample throws', (t) => {
    t.plan(1);
    t.assert.throws(() => {
      sharp().webp({ smartSubsample: 1 });
    });
  });

  test('can produce a different file size using smartDeblock', async (t) => {
    t.plan(1);
    const withoutSmartDeblock = await sharp(fixtures.inputPngOverlayLayer0)
      .resize(320, 240)
      .webp({ quality: 30, smartDeblock: false })
      .toBuffer();
    const withSmartDeblock = await sharp(fixtures.inputPngOverlayLayer0)
      .resize(320, 240)
      .webp({ quality: 30, smartDeblock: true })
      .toBuffer();
    t.assert.strictEqual(true, withSmartDeblock.length !== withoutSmartDeblock.length);
  });

  test('invalid smartDeblock throws', (t) => {
    t.plan(1);
    t.assert.throws(
      () => sharp().webp({ smartDeblock: 1 }),
      /Expected boolean for webpSmartDeblock but received 1 of type number/
    );
  });

  test('should produce a different file size with specific preset', async (t) => {
    t.plan(1);
    const presetDefault = await sharp(fixtures.inputJpg)
      .resize(320, 240)
      .webp({ preset: 'default' })
      .toBuffer();
    const presetPicture = await sharp(fixtures.inputJpg)
      .resize(320, 240)
      .webp({ preset: 'picture' })
      .toBuffer();
    t.assert.notStrictEqual(presetDefault.length, presetPicture.length);
  });

  test('invalid preset throws', (t) => {
    t.plan(1);
    t.assert.throws(
      () => sharp().webp({ preset: 'fail' }),
      /Expected one of: default, photo, picture, drawing, icon, text for preset but received fail of type string/
    );
  });

  test('should produce a smaller file size with increased effort', async (t) => {
    t.plan(1);
    const effort4 = await sharp(fixtures.inputJpg)
      .resize(320, 240)
      .webp()
      .toBuffer();
    const effort6 = await sharp(fixtures.inputJpg)
      .resize(320, 240)
      .webp({ effort: 6 })
      .toBuffer();
    t.assert.strictEqual(true, effort4.length > effort6.length);
  });

  test('should produce different file size with/out shrink-on-load', async (t) => {
    t.plan(1);
    const [shrunk, resized] = await Promise.all([
      sharp(fixtures.inputWebP).resize({ width: 16 }).toBuffer(),
      sharp(fixtures.inputWebP).resize({ width: 16, fastShrinkOnLoad: false, kernel: 'nearest' }).toBuffer()
    ]);
    t.assert.notStrictEqual(shrunk.length, resized.length);
  });

  test('invalid effort throws', (t) => {
    t.plan(1);
    t.assert.throws(() => {
      sharp().webp({ effort: true });
    });
  });

  test('out of range effort throws', (t) => {
    t.plan(1);
    t.assert.throws(() => {
      sharp().webp({ effort: -1 });
    });
  });

  test('should set effort to 0', (t) => {
    t.plan(1);
    const effort = sharp().webp({ effort: 0 }).options.webpEffort;

    t.assert.strictEqual(effort, 0);
  });

  test('valid minSize', (t) => {
    t.plan(1);
    t.assert.doesNotThrow(() => sharp().webp({ minSize: true }));
  });

  test('invalid minSize throws', (t) => {
    t.plan(1);
    t.assert.throws(
      () => sharp().webp({ minSize: 1 }),
      /Expected boolean for webpMinSize but received 1 of type number/
    );
  });

  test('valid mixed', (t) => {
    t.plan(1);
    t.assert.doesNotThrow(() => sharp().webp({ mixed: true }));
  });

  test('invalid mixed throws', (t) => {
    t.plan(1);
    t.assert.throws(
      () => sharp().webp({ mixed: 'fail' }),
      /Expected boolean for webpMixed but received fail of type string/
    );
  });

  test('valid exact', (t) => {
    t.plan(1);
    t.assert.doesNotThrow(() => sharp().webp({ exact: true }));
  });

  test('invalid exact throws', (t) => {
    t.plan(1);
    t.assert.throws(
      () => sharp().webp({ exact: 'fail' }),
      /Expected boolean for webpExact but received fail of type string/
    );
  });

  test('saving exact pixel colour values produces larger file size', async (t) => {
    t.plan(1);
    const withExact = await
      sharp(fixtures.inputPngAlphaPremultiplicationSmall)
        .resize(8, 8)
        .webp({ exact: true, effort: 0 })
        .toBuffer();

    const withoutExact = await
      sharp(fixtures.inputPngAlphaPremultiplicationSmall)
        .resize(8, 8)
        .webp({ exact: false, effort: 0 })
        .toBuffer()

    t.assert.strictEqual(true, withExact.length > withoutExact.length);
  });

  test('invalid loop throws', (t) => {
    t.plan(2);
    t.assert.throws(() => {
      sharp().webp({ loop: -1 });
    });

    t.assert.throws(() => {
      sharp().webp({ loop: 65536 });
    });
  });

  test('invalid delay throws', (t) => {
    t.plan(2);
    t.assert.throws(() => {
      sharp().webp({ delay: -1 });
    });

    t.assert.throws(() => {
      sharp().webp({ delay: [65536] });
    });
  });

  test('should repeat a single delay for all frames', async (t) => {
    t.plan(1);
    const data = await sharp(fixtures.inputWebPAnimated, { pages: -1 })
      .webp({ delay: 100 })
      .toBuffer();
    const updated = await sharp(data, { pages: -1 }).metadata();

    t.assert.deepStrictEqual(updated.delay, Array(updated.pages).fill(100));
  });

  test('should limit animation loop', async (t) => {
    t.plan(1);
    const data = await sharp(fixtures.inputWebPAnimated, { pages: -1 })
      .webp({ loop: 3 })
      .toBuffer();
    const updated = await sharp(data, { pages: -1 }).metadata();

    t.assert.strictEqual(updated.loop, 3);
  });

  test('should change delay between frames', async (t) => {
    t.plan(1);
    const original = await sharp(fixtures.inputWebPAnimated, { pages: -1 }).metadata();

    const expectedDelay = [...Array(original.pages).fill(40)];
    const data = await sharp(fixtures.inputWebPAnimated, { pages: -1 })
      .webp({ delay: expectedDelay })
      .toBuffer();
    const updated = await sharp(data, { pages: -1 }).metadata();

    t.assert.deepStrictEqual(updated.delay, expectedDelay);
  });

  test('should preserve delay between frames', async (t) => {
    t.plan(1);
    const data = await sharp(fixtures.inputWebPAnimated, { pages: -1 })
      .webp()
      .toBuffer();
    const updated = await sharp(data, { pages: -1 }).metadata();

    t.assert.deepStrictEqual(updated.delay, [120, 120, 90, 120, 120, 90, 120, 90, 30]);
  });

  test('should work with streams when only animated is set', async (t) => {
    t.plan(3);
    const writeable = sharp({ animated: true }).webp({ lossless: true, effort: 0 });
    const fd = await fs.open(fixtures.inputWebPAnimated);
    fd.createReadStream().pipe(writeable);
    const { data, info } = await writeable.toBuffer({ resolveWithObject: true });
    t.assert.strictEqual(true, data.length > 0);
    t.assert.strictEqual('webp', info.format);
    await t.assert.doesNotReject(() => fixtures.assertSimilar(fixtures.inputWebPAnimated, data));
  });

  test('should work with streams when only pages is set', async (t) => {
    t.plan(3);
    const writeable = sharp({ pages: -1 }).webp({ lossless: true, effort: 0 });
    const fd = await fs.open(fixtures.inputWebPAnimated);
    fd.createReadStream().pipe(writeable);
    const { data, info } = await writeable.toBuffer({ resolveWithObject: true });
    t.assert.strictEqual(true, data.length > 0);
    t.assert.strictEqual('webp', info.format);
    await t.assert.doesNotReject(() => fixtures.assertSimilar(fixtures.inputWebPAnimated, data));
  });

  test('should resize animated image to page height', async (t) => {
    t.plan(2);
    const data = await sharp(fixtures.inputWebPAnimated, { pages: -1 })
      .resize({ height: 570 })
      .webp({ effort: 0 })
      .toBuffer();
    const updated = await sharp(data, { pages: -1 }).metadata();

    t.assert.strictEqual(updated.height, 570 * 9);
    t.assert.strictEqual(updated.pageHeight, 570);
  });

  test('should take page parameter into account when animated is set', async (t) => {
    t.plan(2);
    const data = await sharp(fixtures.inputWebPAnimated, { animated: true, page: 2 })
      .resize({ height: 570 })
      .webp({ effort: 0 })
      .toBuffer();
    const updated = await sharp(data, { pages: -1 }).metadata();

    t.assert.strictEqual(updated.height, 570 * 7);
    t.assert.strictEqual(updated.pageHeight, 570);
  });
});
