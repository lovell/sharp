/*!
  SPDX-FileCopyrightText: 2013 Lovell Fuller and others
  SPDX-License-Identifier: Apache-2.0
*/

const { suite, test } = require('node:test');

const sharp = require('../../');
const fixtures = require('../fixtures');

suite('JXL', () => {
  test('called without options does not throw an error', (t) => {
    t.plan(1);
    t.assert.doesNotThrow(() => {
      sharp().jxl();
    });
  });
  test('valid distance does not throw an error', (t) => {
    t.plan(1);
    t.assert.doesNotThrow(() => {
      sharp().jxl({ distance: 2.3 });
    });
  });
  test('invalid distance should throw an error', (t) => {
    t.plan(1);
    t.assert.throws(() => {
      sharp().jxl({ distance: 15.1 });
    });
  });
  test('non-numeric distance should throw an error', (t) => {
    t.plan(1);
    t.assert.throws(() => {
      sharp().jxl({ distance: 'fail' });
    });
  });
  test('valid quality > 30 does not throw an error', (t) => {
    t.plan(2);
    const s = sharp();
    t.assert.doesNotThrow(() => {
      s.jxl({ quality: 80 });
    });
    t.assert.strictEqual(s.options.jxlDistance, 1.9);
  });
  test('valid quality < 30 does not throw an error', (t) => {
    t.plan(2);
    const s = sharp();
    t.assert.doesNotThrow(() => {
      s.jxl({ quality: 20 });
    });
    t.assert.strictEqual(s.options.jxlDistance, 9.066666666666666);
  });
  test('valid quality does not throw an error', (t) => {
    t.plan(1);
    t.assert.doesNotThrow(() => {
      sharp().jxl({ quality: 80 });
    });
  });
  test('invalid quality should throw an error', (t) => {
    t.plan(1);
    t.assert.throws(() => {
      sharp().jxl({ quality: 101 });
    });
  });
  test('non-numeric quality should throw an error', (t) => {
    t.plan(1);
    t.assert.throws(() => {
      sharp().jxl({ quality: 'fail' });
    });
  });
  test('valid decodingTier does not throw an error', (t) => {
    t.plan(1);
    t.assert.doesNotThrow(() => {
      sharp().jxl({ decodingTier: 2 });
    });
  });
  test('invalid decodingTier should throw an error', (t) => {
    t.plan(1);
    t.assert.throws(() => {
      sharp().jxl({ decodingTier: 5 });
    });
  });
  test('non-numeric decodingTier should throw an error', (t) => {
    t.plan(1);
    t.assert.throws(() => {
      sharp().jxl({ decodingTier: 'fail' });
    });
  });
  test('valid lossless does not throw an error', (t) => {
    t.plan(1);
    t.assert.doesNotThrow(() => {
      sharp().jxl({ lossless: true });
    });
  });
  test('non-boolean lossless should throw an error', (t) => {
    t.plan(1);
    t.assert.throws(() => {
      sharp().jxl({ lossless: 'fail' });
    });
  });
  test('valid effort does not throw an error', (t) => {
    t.plan(1);
    t.assert.doesNotThrow(() => {
      sharp().jxl({ effort: 6 });
    });
  });
  test('out of range effort should throw an error', (t) => {
    t.plan(1);
    t.assert.throws(() => {
      sharp().jxl({ effort: 10 });
    });
  });
  test('invalid effort should throw an error', (t) => {
    t.plan(1);
    t.assert.throws(() => {
      sharp().jxl({ effort: 'fail' });
    });
  });
  test('invalid loop throws', (t) => {
    t.plan(2);
    t.assert.throws(() => {
      sharp().jxl({ loop: -1 });
    });
    t.assert.throws(() => {
      sharp().jxl({ loop: 65536 });
    });
  });
  test('invalid delay throws', (t) => {
    t.plan(2);
    t.assert.throws(() => {
      sharp().jxl({ delay: -1 });
    });
    t.assert.throws(() => {
      sharp().jxl({ delay: [65536] });
    });
  });

  suite('animated', { skip: !sharp.format.jxl.input.buffer || !sharp.format.jxl.output.buffer }, () => {
    test('should read animated image', async (t) => {
      t.plan(5);
      const { format, pages, pageHeight, loop, delay } = await sharp(fixtures.inputJxlAnimated, { pages: -1 }).metadata();
      t.assert.strictEqual(format, 'jxl');
      t.assert.strictEqual(pages, 30);
      t.assert.strictEqual(pageHeight, 80);
      t.assert.strictEqual(loop, 0);
      t.assert.deepStrictEqual(delay, Array(30).fill(30));
    });
    test('should repeat a single delay for all frames', async (t) => {
      t.plan(1);
      const data = await sharp(fixtures.inputJxlAnimated, { pages: -1 })
        .jxl({ delay: 100 })
        .toBuffer();
      const updated = await sharp(data, { pages: -1 }).metadata();

      t.assert.deepStrictEqual(updated.delay, Array(updated.pages).fill(100));
    });
    test('should limit animation loop', async (t) => {
      t.plan(1);
      const data = await sharp(fixtures.inputJxlAnimated, { pages: -1 })
        .jxl({ loop: 3 })
        .toBuffer();
      const updated = await sharp(data, { pages: -1 }).metadata();

      t.assert.strictEqual(updated.loop, 3);
    });
    test('should change delay between frames', async (t) => {
      t.plan(1);
      const original = await sharp(fixtures.inputJxlAnimated, { pages: -1 }).metadata();

      const expectedDelay = [...Array(original.pages).fill(40)];
      const data = await sharp(fixtures.inputJxlAnimated, { pages: -1 })
        .jxl({ delay: expectedDelay })
        .toBuffer();
      const updated = await sharp(data, { pages: -1 }).metadata();

      t.assert.deepStrictEqual(updated.delay, expectedDelay);
    });
    test('should preserve delay between frames', async (t) => {
      t.plan(1);
      const data = await sharp(fixtures.inputJxlAnimated, { pages: -1 })
        .jxl()
        .toBuffer();
      const updated = await sharp(data, { pages: -1 }).metadata();

      t.assert.deepStrictEqual(updated.delay, Array(30).fill(30));
    });
    test('should round trip to file', async (t) => {
      t.plan(3);
      const output = fixtures.path('output.animated.jxl');
      await sharp(fixtures.inputJxlAnimated, { pages: -1 }).jxl({ loop: 3 }).toFile(output);
      const { pages, loop, delay } = await sharp(output, { pages: -1 }).metadata();
      t.assert.strictEqual(pages, 30);
      t.assert.strictEqual(loop, 3);
      t.assert.deepStrictEqual(delay, Array(30).fill(30));
    });
    test('should resize animated image to page height', async (t) => {
      t.plan(2);
      const data = await sharp(fixtures.inputJxlAnimated, { pages: -1 })
        .resize({ height: 40 })
        .jxl({ effort: 1 })
        .toBuffer();
      const updated = await sharp(data, { pages: -1 }).metadata();

      t.assert.strictEqual(updated.height, 40 * 30);
      t.assert.strictEqual(updated.pageHeight, 40);
    });
  });
});
