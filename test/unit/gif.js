/*!
  Copyright 2013 Lovell Fuller and others.
  SPDX-License-Identifier: Apache-2.0
*/

const fs = require('node:fs');
const { describe, it } = require('node:test');
const assert = require('node:assert');

const sharp = require('../../');
const fixtures = require('../fixtures');

describe('GIF input', () => {
  it('GIF Buffer to JPEG Buffer', () =>
    sharp(fs.readFileSync(fixtures.inputGif))
      .resize(8, 4)
      .jpeg()
      .toBuffer({ resolveWithObject: true })
      .then(({ data, info }) => {
        assert.strictEqual(true, data.length > 0);
        assert.strictEqual(data.length, info.size);
        assert.strictEqual('jpeg', info.format);
        assert.strictEqual(8, info.width);
        assert.strictEqual(4, info.height);
      })
  );

  it('2 channel GIF file to PNG Buffer', () =>
    sharp(fixtures.inputGifGreyPlusAlpha)
      .resize(8, 4)
      .png()
      .toBuffer({ resolveWithObject: true })
      .then(({ data, info }) => {
        assert.strictEqual(true, data.length > 0);
        assert.strictEqual(data.length, info.size);
        assert.strictEqual('png', info.format);
        assert.strictEqual(8, info.width);
        assert.strictEqual(4, info.height);
        assert.strictEqual(4, info.channels);
      })
  );

  it('Animated GIF first page to non-animated GIF', () =>
    sharp(fixtures.inputGifAnimated)
      .toBuffer({ resolveWithObject: true })
      .then(({ data, info }) => {
        assert.strictEqual(true, data.length > 0);
        assert.strictEqual(data.length, info.size);
        assert.strictEqual('gif', info.format);
        assert.strictEqual(80, info.width);
        assert.strictEqual(80, info.height);
        assert.strictEqual(4, info.channels);
        assert.strictEqual(undefined, info.pages);
        assert.strictEqual(undefined, info.pageHeight);
      })
  );

  it('Animated GIF round trip', () =>
    sharp(fixtures.inputGifAnimated, { pages: -1 })
      .toBuffer({ resolveWithObject: true })
      .then(({ data, info }) => {
        assert.strictEqual(true, data.length > 0);
        assert.strictEqual(data.length, info.size);
        assert.strictEqual('gif', info.format);
        assert.strictEqual(80, info.width);
        assert.strictEqual(2400, info.height);
        assert.strictEqual(4, info.channels);
        assert.strictEqual(30, info.pages);
        assert.strictEqual(80, info.pageHeight);
      })
  );

  it('GIF with reduced colours, no dither, low effort reduces file size', async () => {
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

    assert.strictEqual(true, reduced.length < original.length);
  });

  it('valid reuse', () => {
    assert.doesNotThrow(() => sharp().gif({ reuse: true }));
    assert.doesNotThrow(() => sharp().gif({ reuse: false }));
  });

  it('invalid reuse throws', () => {
    assert.throws(
      () => sharp().gif({ reuse: -1 }),
      /Expected boolean for gifReuse but received -1 of type number/
    );
    assert.throws(
      () => sharp().gif({ reuse: 'fail' }),
      /Expected boolean for gifReuse but received fail of type string/
    );
  });

  it('progressive changes file size', async () => {
    const nonProgressive = await sharp(fixtures.inputGif).gif({ progressive: false }).toBuffer();
    const progressive = await sharp(fixtures.inputGif).gif({ progressive: true }).toBuffer();
    assert(nonProgressive.length !== progressive.length);
  });

  it('invalid progressive throws', () => {
    assert.throws(
      () => sharp().gif({ progressive: -1 }),
      /Expected boolean for gifProgressive but received -1 of type number/
    );
    assert.throws(
      () => sharp().gif({ progressive: 'fail' }),
      /Expected boolean for gifProgressive but received fail of type string/
    );
  });

  it('invalid loop throws', () => {
    assert.throws(() => {
      sharp().gif({ loop: -1 });
    });
    assert.throws(() => {
      sharp().gif({ loop: 65536 });
    });
  });

  it('invalid delay throws', () => {
    assert.throws(() => {
      sharp().gif({ delay: -1 });
    });
    assert.throws(() => {
      sharp().gif({ delay: [65536] });
    });
  });

  it('invalid colour throws', () => {
    assert.throws(() => {
      sharp().gif({ colours: 1 });
    });
    assert.throws(() => {
      sharp().gif({ colours: 'fail' });
    });
  });

  it('invalid effort throws', () => {
    assert.throws(() => {
      sharp().gif({ effort: 0 });
    });
    assert.throws(() => {
      sharp().gif({ effort: 'fail' });
    });
  });

  it('invalid dither throws', () => {
    assert.throws(() => {
      sharp().gif({ dither: 1.1 });
    });
    assert.throws(() => {
      sharp().gif({ effort: 'fail' });
    });
  });

  it('invalid interFrameMaxError throws', () => {
    assert.throws(
      () => sharp().gif({ interFrameMaxError: 33 }),
      /Expected number between 0.0 and 32.0 for interFrameMaxError but received 33 of type number/
    );
    assert.throws(
      () => sharp().gif({ interFrameMaxError: 'fail' }),
      /Expected number between 0.0 and 32.0 for interFrameMaxError but received fail of type string/
    );
  });

  it('invalid interPaletteMaxError throws', () => {
    assert.throws(
      () => sharp().gif({ interPaletteMaxError: 257 }),
      /Expected number between 0.0 and 256.0 for interPaletteMaxError but received 257 of type number/
    );
    assert.throws(
      () => sharp().gif({ interPaletteMaxError: 'fail' }),
      /Expected number between 0.0 and 256.0 for interPaletteMaxError but received fail of type string/
    );
  });

  it('invalid keepDuplicateFrames throws', () => {
    assert.throws(
      () => sharp().gif({ keepDuplicateFrames: -1 }),
      /Expected boolean for keepDuplicateFrames but received -1 of type number/
    );
    assert.throws(
      () => sharp().gif({ keepDuplicateFrames: 'fail' }),
      /Expected boolean for keepDuplicateFrames but received fail of type string/
    );
  });

  it('should work with streams when only animated is set', (_t, done) => {
    fs.createReadStream(fixtures.inputGifAnimated)
      .pipe(sharp({ animated: true }))
      .gif()
      .toBuffer((err, data, info) => {
        if (err) throw err;
        assert.strictEqual(true, data.length > 0);
        assert.strictEqual('gif', info.format);
        fixtures.assertSimilar(fixtures.inputGifAnimated, data, done);
      });
  });

  it('should work with streams when only pages is set', (_t, done) => {
    fs.createReadStream(fixtures.inputGifAnimated)
      .pipe(sharp({ pages: -1 }))
      .gif()
      .toBuffer((err, data, info) => {
        if (err) throw err;
        assert.strictEqual(true, data.length > 0);
        assert.strictEqual('gif', info.format);
        fixtures.assertSimilar(fixtures.inputGifAnimated, data, done);
      });
  });

  it('should optimise file size via interFrameMaxError', async () => {
    const input = sharp(fixtures.inputGifAnimated, { animated: true });
    const before = await input.gif({ interFrameMaxError: 0 }).toBuffer();
    const after = await input.gif({ interFrameMaxError: 10 }).toBuffer();
    assert.strict(before.length > after.length);
  });

  it('should optimise file size via interPaletteMaxError', async () => {
    const input = sharp(fixtures.inputGifAnimated, { animated: true });
    const before = await input.gif({ interPaletteMaxError: 0 }).toBuffer();
    const after = await input.gif({ interPaletteMaxError: 100 }).toBuffer();
    assert.strict(before.length > after.length);
  });

  it('should keep duplicate frames via keepDuplicateFrames', async () => {
    const create = { width: 8, height: 8, channels: 4, background: 'blue' };
    const input = sharp([{ create }, { create }], { join: { animated: true } });

    const before = await input.gif({ keepDuplicateFrames: false }).toBuffer();
    const after = await input.gif({ keepDuplicateFrames: true }).toBuffer();
    assert.strict(before.length < after.length);

    const beforeMeta = await sharp(before).metadata();
    const afterMeta = await sharp(after).metadata();
    assert.strictEqual(beforeMeta.pages, 1);
    assert.strictEqual(afterMeta.pages, 2);
  });

  it('non-animated input defaults to no-loop', async () => {
    for (const input of [fixtures.inputGif, fixtures.inputPng]) {
      const data = await sharp(input)
        .resize(8)
        .gif({ effort: 1 })
        .toBuffer();

      const { format, pages, loop } = await sharp(data).metadata();
      assert.strictEqual('gif', format);
      assert.strictEqual(1, pages);
      assert.strictEqual(1, loop);
    }
  });

  it('Animated GIF to animated WebP merges identical frames', async () => {
    const webp = await sharp(fixtures.inputGifAnimated, { animated: true })
      .webp()
      .toBuffer();

    const { delay, loop, pages } = await sharp(webp).metadata();
    assert.deepStrictEqual([120, 120, 90, 120, 120, 90, 120, 90, 30], delay);
    assert.strictEqual(0, loop);
    assert.strictEqual(9, pages);
  });
});
