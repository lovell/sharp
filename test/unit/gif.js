/*!
  Copyright 2013 Lovell Fuller and others.
  SPDX-License-Identifier: Apache-2.0
*/

import fs from 'node:fs/promises';
import { suite, test } from 'node:test';

import sharp from '../../lib/index.js';
import fixtures from '../fixtures/index.js';

suite('GIF input', () => {
  test('GIF Buffer to JPEG Buffer', async (t) => {
    t.plan(5);
    const input = await fs.readFile(fixtures.inputGif);
    const { data, info } = await sharp(input)
      .resize(8, 4)
      .jpeg()
      .toBuffer({ resolveWithObject: true });
    t.assert.strictEqual(true, data.length > 0);
    t.assert.strictEqual(data.length, info.size);
    t.assert.strictEqual('jpeg', info.format);
    t.assert.strictEqual(8, info.width);
    t.assert.strictEqual(4, info.height);
  });

  test('2 channel GIF file to PNG Buffer', async (t) => {
    t.plan(6);
    const { data, info } = await sharp(fixtures.inputGifGreyPlusAlpha)
      .resize(8, 4)
      .png()
      .toBuffer({ resolveWithObject: true });
    t.assert.strictEqual(true, data.length > 0);
    t.assert.strictEqual(data.length, info.size);
    t.assert.strictEqual('png', info.format);
    t.assert.strictEqual(8, info.width);
    t.assert.strictEqual(4, info.height);
    t.assert.strictEqual(4, info.channels);
  });

  test('Animated GIF first page to non-animated GIF', async (t) => {
    t.plan(8);
    const { data, info } = await sharp(fixtures.inputGifAnimated).toBuffer({ resolveWithObject: true });
    t.assert.strictEqual(true, data.length > 0);
    t.assert.strictEqual(data.length, info.size);
    t.assert.strictEqual('gif', info.format);
    t.assert.strictEqual(80, info.width);
    t.assert.strictEqual(80, info.height);
    t.assert.strictEqual(4, info.channels);
    t.assert.strictEqual(undefined, info.pages);
    t.assert.strictEqual(undefined, info.pageHeight);
  });

  test('Animated GIF round trip', async (t) => {
    t.plan(8);
    const { data, info } = await sharp(fixtures.inputGifAnimated, { pages: -1 }).toBuffer({ resolveWithObject: true });
    t.assert.strictEqual(true, data.length > 0);
    t.assert.strictEqual(data.length, info.size);
    t.assert.strictEqual('gif', info.format);
    t.assert.strictEqual(80, info.width);
    t.assert.strictEqual(2400, info.height);
    t.assert.strictEqual(4, info.channels);
    t.assert.strictEqual(30, info.pages);
    t.assert.strictEqual(80, info.pageHeight);
  });

  test('GIF with reduced colours, no dither, low effort reduces file size', async (t) => {
    t.plan(1);
    const original = await sharp(fixtures.inputJpg)
      .resize(120, 80)
      .gif()
      .toBuffer();

    const reduced = await sharp(fixtures.inputJpg)
      .resize(120, 80)
      .gif({
        colours: 128,
        dither: 0,
        effort: 1
      })
      .toBuffer();

    t.assert.strictEqual(true, reduced.length < original.length);
  });

  test('valid reuse', (t) => {
    t.plan(2);
    t.assert.doesNotThrow(() => sharp().gif({ reuse: true }));
    t.assert.doesNotThrow(() => sharp().gif({ reuse: false }));
  });

  test('invalid reuse throws', (t) => {
    t.plan(2);
    t.assert.throws(
      () => sharp().gif({ reuse: -1 }),
      /Expected boolean for gifReuse but received -1 of type number/
    );
    t.assert.throws(
      () => sharp().gif({ reuse: 'fail' }),
      /Expected boolean for gifReuse but received fail of type string/
    );
  });

  test('progressive changes file size', async (t) => {
    t.plan(1);
    const nonProgressive = await sharp(fixtures.inputGif).gif({ progressive: false }).toBuffer();
    const progressive = await sharp(fixtures.inputGif).gif({ progressive: true }).toBuffer();
    t.assert.ok(nonProgressive.length !== progressive.length);
  });

  test('invalid progressive throws', (t) => {
    t.plan(2);
    t.assert.throws(
      () => sharp().gif({ progressive: -1 }),
      /Expected boolean for gifProgressive but received -1 of type number/
    );
    t.assert.throws(
      () => sharp().gif({ progressive: 'fail' }),
      /Expected boolean for gifProgressive but received fail of type string/
    );
  });

  test('invalid loop throws', (t) => {
    t.plan(2);
    t.assert.throws(() => {
      sharp().gif({ loop: -1 });
    });
    t.assert.throws(() => {
      sharp().gif({ loop: 65536 });
    });
  });

  test('invalid delay throws', (t) => {
    t.plan(2);
    t.assert.throws(() => {
      sharp().gif({ delay: -1 });
    });
    t.assert.throws(() => {
      sharp().gif({ delay: [65536] });
    });
  });

  test('invalid colour throws', (t) => {
    t.plan(2);
    t.assert.throws(() => {
      sharp().gif({ colours: 1 });
    });
    t.assert.throws(() => {
      sharp().gif({ colours: 'fail' });
    });
  });

  test('invalid effort throws', (t) => {
    t.plan(3);
    t.assert.throws(() => {
      sharp().gif({ effort: 0 });
    });
    t.assert.throws(
      () => sharp().gif({ effort: 7.5 }),
      /Expected integer between 1 and 10 for effort but received 7.5 of type number/
    );
    t.assert.throws(() => {
      sharp().gif({ effort: 'fail' });
    });
  });

  test('invalid dither throws', (t) => {
    t.plan(2);
    t.assert.throws(() => {
      sharp().gif({ dither: 1.1 });
    });
    t.assert.throws(() => {
      sharp().gif({ effort: 'fail' });
    });
  });

  test('invalid interFrameMaxError throws', (t) => {
    t.plan(2);
    t.assert.throws(
      () => sharp().gif({ interFrameMaxError: 33 }),
      /Expected number between 0.0 and 32.0 for interFrameMaxError but received 33 of type number/
    );
    t.assert.throws(
      () => sharp().gif({ interFrameMaxError: 'fail' }),
      /Expected number between 0.0 and 32.0 for interFrameMaxError but received fail of type string/
    );
  });

  test('invalid interPaletteMaxError throws', (t) => {
    t.plan(2);
    t.assert.throws(
      () => sharp().gif({ interPaletteMaxError: 257 }),
      /Expected number between 0.0 and 256.0 for interPaletteMaxError but received 257 of type number/
    );
    t.assert.throws(
      () => sharp().gif({ interPaletteMaxError: 'fail' }),
      /Expected number between 0.0 and 256.0 for interPaletteMaxError but received fail of type string/
    );
  });

  test('invalid keepDuplicateFrames throws', (t) => {
    t.plan(2);
    t.assert.throws(
      () => sharp().gif({ keepDuplicateFrames: -1 }),
      /Expected boolean for keepDuplicateFrames but received -1 of type number/
    );
    t.assert.throws(
      () => sharp().gif({ keepDuplicateFrames: 'fail' }),
      /Expected boolean for keepDuplicateFrames but received fail of type string/
    );
  });

  test('should work with streams when only animated is set', async (t) => {
    t.plan(2);
    const writable = sharp({ animated: true }).gif();
    const fd = await fs.open(fixtures.inputGifAnimated);
    fd.createReadStream().pipe(writable);
    const { data, info } = await writable.toBuffer({ resolveWithObject: true });
    t.assert.strictEqual(true, data.length > 0);
    t.assert.strictEqual('gif', info.format);
    await fixtures.assertSimilar(fixtures.inputGifAnimated, data);
  });

  test('should work with streams when only pages is set', async (t) => {
    t.plan(2);
    const writable = sharp({ pages: -1 }).gif();
    const fd = await fs.open(fixtures.inputGifAnimated);
    fd.createReadStream().pipe(writable)
    const { data, info } = await writable.toBuffer({ resolveWithObject: true })
    t.assert.strictEqual(true, data.length > 0);
    t.assert.strictEqual('gif', info.format);
    await fixtures.assertSimilar(fixtures.inputGifAnimated, data);
  });

  test('should optimise file size via interFrameMaxError', async (t) => {
    t.plan(1);
    const input = sharp(fixtures.inputGifAnimated, { animated: true });
    const before = await input.gif({ interFrameMaxError: 0 }).toBuffer();
    const after = await input.gif({ interFrameMaxError: 10 }).toBuffer();
    t.assert.ok(before.length > after.length);
  });

  test('should optimise file size via interPaletteMaxError', async (t) => {
    t.plan(1);
    const input = sharp(fixtures.inputGifAnimated, { animated: true });
    const before = await input.gif({ interPaletteMaxError: 0 }).toBuffer();
    const after = await input.gif({ interPaletteMaxError: 100 }).toBuffer();
    t.assert.ok(before.length > after.length);
  });

  test('should keep duplicate frames via keepDuplicateFrames', async (t) => {
    t.plan(3);
    const create = { width: 8, height: 8, channels: 4, background: 'blue' };
    const input = sharp([{ create }, { create }], { join: { animated: true } });

    const before = await input.gif({ keepDuplicateFrames: false }).toBuffer();
    const after = await input.gif({ keepDuplicateFrames: true }).toBuffer();
    t.assert.ok(before.length < after.length);

    const beforeMeta = await sharp(before).metadata();
    const afterMeta = await sharp(after).metadata();
    t.assert.strictEqual(beforeMeta.pages, 1);
    t.assert.strictEqual(afterMeta.pages, 2);
  });

  test('non-animated input defaults to no-loop', async (t) => {
    t.plan(6);
    for (const input of [fixtures.inputGif, fixtures.inputPng]) {
      const data = await sharp(input)
        .resize(8)
        .gif({ effort: 1 })
        .toBuffer();

      const { format, pages, loop } = await sharp(data).metadata();
      t.assert.strictEqual('gif', format);
      t.assert.strictEqual(1, pages);
      t.assert.strictEqual(1, loop);
    }
  });

  test('Animated GIF to animated WebP merges identical frames', async (t) => {
    t.plan(3);
    const webp = await sharp(fixtures.inputGifAnimated, { animated: true })
      .webp()
      .toBuffer();

    const { delay, loop, pages } = await sharp(webp).metadata();
    t.assert.deepStrictEqual([120, 120, 90, 120, 120, 90, 120, 90, 30], delay);
    t.assert.strictEqual(0, loop);
    t.assert.strictEqual(9, pages);
  });
});
