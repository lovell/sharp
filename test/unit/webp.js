// Copyright 2013 Lovell Fuller and others.
// SPDX-License-Identifier: Apache-2.0

'use strict';

const fs = require('fs');
const assert = require('assert');

const sharp = require('../../');
const fixtures = require('../fixtures');

describe('WebP', function () {
  it('WebP output', function (done) {
    sharp(fixtures.inputJpg)
      .resize(320, 240)
      .toFormat(sharp.format.webp)
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual(true, data.length > 0);
        assert.strictEqual('webp', info.format);
        assert.strictEqual(320, info.width);
        assert.strictEqual(240, info.height);
        done();
      });
  });

  it('Invalid WebP quality throws error', function () {
    assert.throws(function () {
      sharp().webp({ quality: 101 });
    });
  });

  it('Invalid WebP alpha quality throws error', function () {
    assert.throws(function () {
      sharp().webp({ alphaQuality: 101 });
    });
  });

  it('should work for webp alpha quality', function (done) {
    sharp(fixtures.inputPngAlphaPremultiplicationSmall)
      .webp({ alphaQuality: 80, effort: 0 })
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual(true, data.length > 0);
        assert.strictEqual('webp', info.format);
        fixtures.assertSimilar(fixtures.expected('webp-alpha-80.webp'), data, done);
      });
  });

  it('should work for webp lossless', function (done) {
    sharp(fixtures.inputPngAlphaPremultiplicationSmall)
      .webp({ lossless: true, effort: 0 })
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual(true, data.length > 0);
        assert.strictEqual('webp', info.format);
        fixtures.assertSimilar(fixtures.expected('webp-lossless.webp'), data, done);
      });
  });

  it('should work for webp near-lossless', function (done) {
    sharp(fixtures.inputPngAlphaPremultiplicationSmall)
      .webp({ nearLossless: true, quality: 50, effort: 0 })
      .toBuffer(function (err50, data50, info50) {
        if (err50) throw err50;
        assert.strictEqual(true, data50.length > 0);
        assert.strictEqual('webp', info50.format);
        fixtures.assertSimilar(fixtures.expected('webp-near-lossless-50.webp'), data50, done);
      });
  });

  it('should use near-lossless when both lossless and nearLossless are specified', function (done) {
    sharp(fixtures.inputPngAlphaPremultiplicationSmall)
      .webp({ nearLossless: true, quality: 50, lossless: true, effort: 0 })
      .toBuffer(function (err50, data50, info50) {
        if (err50) throw err50;
        assert.strictEqual(true, data50.length > 0);
        assert.strictEqual('webp', info50.format);
        fixtures.assertSimilar(fixtures.expected('webp-near-lossless-50.webp'), data50, done);
      });
  });

  it('should produce a larger file size using smartSubsample', () =>
    sharp(fixtures.inputJpg)
      .resize(320, 240)
      .webp({ smartSubsample: false })
      .toBuffer()
      .then(withoutSmartSubsample =>
        sharp(fixtures.inputJpg)
          .resize(320, 240)
          .webp({ smartSubsample: true })
          .toBuffer()
          .then(withSmartSubsample => {
            assert.strictEqual(true, withSmartSubsample.length > withoutSmartSubsample.length);
          })
      )
  );

  it('invalid smartSubsample throws', () => {
    assert.throws(() => {
      sharp().webp({ smartSubsample: 1 });
    });
  });

  it('can produce a different file size using smartDeblock', () =>
    sharp(fixtures.inputPngOverlayLayer0)
      .resize(320, 240)
      .webp({ quality: 30, smartDeblock: false })
      .toBuffer()
      .then(withoutSmartDeblock =>
        sharp(fixtures.inputPngOverlayLayer0)
          .resize(320, 240)
          .webp({ quality: 30, smartDeblock: true })
          .toBuffer()
          .then(withSmartDeblock => {
            assert.strictEqual(true, withSmartDeblock.length !== withoutSmartDeblock.length);
          })
      )
  );

  it('invalid smartDeblock throws', () => {
    assert.throws(
      () => sharp().webp({ smartDeblock: 1 }),
      /Expected boolean for webpSmartDeblock but received 1 of type number/
    );
  });

  it('should produce a different file size with specific preset', () =>
    sharp(fixtures.inputJpg)
      .resize(320, 240)
      .webp({ preset: 'default' })
      .toBuffer()
      .then(presetDefault =>
        sharp(fixtures.inputJpg)
          .resize(320, 240)
          .webp({ preset: 'picture' })
          .toBuffer()
          .then(presetPicture => {
            assert.notStrictEqual(presetDefault.length, presetPicture.length);
          })
      )
  );

  it('invalid preset throws', () => {
    assert.throws(
      () => sharp().webp({ preset: 'fail' }),
      /Expected one of: default, photo, picture, drawing, icon, text for preset but received fail of type string/
    );
  });

  it('should produce a smaller file size with increased effort', () =>
    sharp(fixtures.inputJpg)
      .resize(320, 240)
      .webp()
      .toBuffer()
      .then(effort4 =>
        sharp(fixtures.inputJpg)
          .resize(320, 240)
          .webp({ effort: 6 })
          .toBuffer()
          .then(effort6 => {
            assert.strictEqual(true, effort4.length > effort6.length);
          })
      )
  );

  it('should produce different file size with/out shrink-on-load', async () => {
    const [shrunk, resized] = await Promise.all([
      sharp(fixtures.inputWebP).resize({ width: 16 }).toBuffer(),
      sharp(fixtures.inputWebP).resize({ width: 16, fastShrinkOnLoad: false, kernel: 'nearest' }).toBuffer()
    ]);
    assert.notStrictEqual(shrunk.length, resized.length);
  });

  it('invalid effort throws', () => {
    assert.throws(() => {
      sharp().webp({ effort: true });
    });
  });

  it('out of range effort throws', () => {
    assert.throws(() => {
      sharp().webp({ effort: -1 });
    });
  });

  it('should set effort to 0', () => {
    const effort = sharp().webp({ effort: 0 }).options.webpEffort;

    assert.strictEqual(effort, 0);
  });

  it('valid minSize', () => {
    assert.doesNotThrow(() => sharp().webp({ minSize: true }));
  });

  it('invalid minSize throws', () => {
    assert.throws(
      () => sharp().webp({ minSize: 1 }),
      /Expected boolean for webpMinSize but received 1 of type number/
    );
  });

  it('valid mixed', () => {
    assert.doesNotThrow(() => sharp().webp({ mixed: true }));
  });

  it('invalid mixed throws', () => {
    assert.throws(
      () => sharp().webp({ mixed: 'fail' }),
      /Expected boolean for webpMixed but received fail of type string/
    );
  });

  it('invalid loop throws', () => {
    assert.throws(() => {
      sharp().webp({ loop: -1 });
    });

    assert.throws(() => {
      sharp().webp({ loop: 65536 });
    });
  });

  it('invalid delay throws', () => {
    assert.throws(() => {
      sharp().webp({ delay: -1 });
    });

    assert.throws(() => {
      sharp().webp({ delay: [65536] });
    });
  });

  it('should repeat a single delay for all frames', async () => {
    const updated = await sharp(fixtures.inputWebPAnimated, { pages: -1 })
      .webp({ delay: 100 })
      .toBuffer()
      .then(data => sharp(data, { pages: -1 }).metadata());

    assert.deepStrictEqual(updated.delay, Array(updated.pages).fill(100));
  });

  it('should limit animation loop', async () => {
    const updated = await sharp(fixtures.inputWebPAnimated, { pages: -1 })
      .webp({ loop: 3 })
      .toBuffer()
      .then(data => sharp(data, { pages: -1 }).metadata());

    assert.strictEqual(updated.loop, 3);
  });

  it('should change delay between frames', async () => {
    const original = await sharp(fixtures.inputWebPAnimated, { pages: -1 }).metadata();

    const expectedDelay = [...Array(original.pages).fill(40)];
    const updated = await sharp(fixtures.inputWebPAnimated, { pages: -1 })
      .webp({ delay: expectedDelay })
      .toBuffer()
      .then(data => sharp(data, { pages: -1 }).metadata());

    assert.deepStrictEqual(updated.delay, expectedDelay);
  });

  it('should preserve delay between frames', async () => {
    const updated = await sharp(fixtures.inputWebPAnimated, { pages: -1 })
      .webp()
      .toBuffer()
      .then(data => sharp(data, { pages: -1 }).metadata());

    assert.deepStrictEqual(updated.delay, [120, 120, 90, 120, 120, 90, 120, 90, 30]);
  });

  it('should work with streams when only animated is set', function (done) {
    fs.createReadStream(fixtures.inputWebPAnimated)
      .pipe(sharp({ animated: true }))
      .webp({ lossless: true, effort: 0 })
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual(true, data.length > 0);
        assert.strictEqual('webp', info.format);
        fixtures.assertSimilar(fixtures.inputWebPAnimated, data, done);
      });
  });

  it('should work with streams when only pages is set', function (done) {
    fs.createReadStream(fixtures.inputWebPAnimated)
      .pipe(sharp({ pages: -1 }))
      .webp({ lossless: true, effort: 0 })
      .toBuffer(function (err, data, info) {
        if (err) throw err;
        assert.strictEqual(true, data.length > 0);
        assert.strictEqual('webp', info.format);
        fixtures.assertSimilar(fixtures.inputWebPAnimated, data, done);
      });
  });

  it('should resize animated image to page height', async () => {
    const updated = await sharp(fixtures.inputWebPAnimated, { pages: -1 })
      .resize({ height: 570 })
      .webp({ effort: 0 })
      .toBuffer()
      .then(data => sharp(data, { pages: -1 }).metadata());

    assert.strictEqual(updated.height, 570 * 9);
    assert.strictEqual(updated.pageHeight, 570);
  });

  it('should take page parameter into account when animated is set', async () => {
    const updated = await sharp(fixtures.inputWebPAnimated, { animated: true, page: 2 })
      .resize({ height: 570 })
      .webp({ effort: 0 })
      .toBuffer()
      .then(data => sharp(data, { pages: -1 }).metadata());

    assert.strictEqual(updated.height, 570 * 7);
    assert.strictEqual(updated.pageHeight, 570);
  });
});
