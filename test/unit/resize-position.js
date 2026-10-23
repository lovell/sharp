/*!
  SPDX-FileCopyrightText: 2013 Lovell Fuller and others
  SPDX-License-Identifier: Apache-2.0
*/

const { suite, test } = require('node:test');

const sharp = require('../../');

// Synthetic pixels vary on both axes so a misplaced crop cannot pass unnoticed.
function input (width, height, pageHeight) {
  const data = Buffer.alloc(width * height * 3);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const offset = (y * width + x) * 3;
      data[offset] = x * 7 % 256;
      data[offset + 1] = y * 11 % 256;
      data[offset + 2] = (x + y) * 13 % 256;
    }
  }
  return sharp(data, { raw: { width, height, channels: 3, pageHeight }, animated: Boolean(pageHeight) });
}

suite('Resize coordinate position', () => {
  const positions = [
    ['northwest', [0, 0]], ['north', [0.5, 0]], ['northeast', [1, 0]],
    ['west', [0, 0.5]], ['centre', [0.5, 0.5]], ['east', [1, 0.5]],
    ['southwest', [0, 1]], ['south', [0.5, 1]], ['southeast', [1, 1]]
  ];

  for (const fit of ['cover', 'contain']) {
    for (const [width, height] of [[20, 12], [21, 12], [12, 20], [12, 21]]) {
      for (const [name, position] of positions) {
        test(`${fit} ${width}x${height} matches ${name}`, async (t) => {
          const size = fit === 'cover' ? 12 : Math.max(width, height);
          const actual = await input(width, height).resize(size, size, { fit, position }).raw().toBuffer();
          const expected = await input(width, height).resize(size, size, { fit, position: name }).raw().toBuffer();
          t.assert.deepStrictEqual(actual, expected);
        });
      }
    }
  }

  for (const [width, height, left, top] of [[21, 12, 2, 0], [12, 21, 0, 7]]) {
    test(`cover ${width}x${height} at [0.25, 0.75]`, async (t) => {
      const actual = await input(width, height).resize(12, 12, { position: [0.25, 0.75] }).raw().toBuffer();
      const expected = await input(width, height).extract({ left, top, width: 12, height: 12 }).raw().toBuffer();
      t.assert.deepStrictEqual(actual, expected);
    });
  }

  for (const [width, height, left, top, right, bottom] of [[21, 12, 0, 6, 0, 3], [12, 21, 2, 0, 7, 0]]) {
    test(`contain ${width}x${height} at [0.25, 0.75]`, async (t) => {
      const actual = await input(width, height)
        .resize(21, 21, { fit: 'contain', position: [0.25, 0.75], background: 'white' }).raw().toBuffer();
      const expected = await input(width, height)
        .extend({ left, top, right, bottom, background: 'white' }).raw().toBuffer();
      t.assert.deepStrictEqual(actual, expected);
    });
  }

  for (const [width, height] of [[42, 24], [21, 12]]) {
    test(`position applies after resizing ${width}x${height}`, async (t) => {
      const actual = await input(width, height)
        .resize(24, 24, { position: [0.25, 0.75], kernel: 'nearest' }).raw().toBuffer();
      const expected = await input(width, height)
        .resize(42, 24, { fit: 'fill', kernel: 'nearest' })
        .extract({ left: 5, top: 0, width: 24, height: 24 }).raw().toBuffer();
      t.assert.deepStrictEqual(actual, expected);
    });
  }

  test('position applies after downscaling', async (t) => {
    const actual = await input(42, 24)
      .resize(12, 12, { position: [0.25, 0.75], kernel: 'nearest' }).raw().toBuffer();
    const expected = await input(42, 24)
      .resize(21, 12, { fit: 'fill', kernel: 'nearest' })
      .extract({ left: 2, top: 0, width: 12, height: 12 }).raw().toBuffer();
    t.assert.deepStrictEqual(actual, expected);
  });

  test('without enlargement clamps the crop to the resized image', async (t) => {
    const actual = await input(21, 12)
      .resize(16, 16, { position: [0.25, 0.75], withoutEnlargement: true }).raw().toBuffer();
    const expected = await input(21, 12).extract({ left: 1, top: 0, width: 16, height: 12 }).raw().toBuffer();
    t.assert.deepStrictEqual(actual, expected);
  });

  test('without reduction positions both axes', async (t) => {
    const actual = await input(21, 17)
      .resize(12, 12, { position: [0.25, 0.75], withoutReduction: true }).raw().toBuffer();
    const expected = await input(21, 17).extract({ left: 2, top: 4, width: 12, height: 12 }).raw().toBuffer();
    t.assert.deepStrictEqual(actual, expected);
  });

  test('auto-orientation happens before positioning', async (t) => {
    const source = await input(21, 12).withMetadata({ orientation: 6 }).png().toBuffer();
    const actual = await sharp(source).autoOrient()
      .resize(12, 12, { position: [0.25, 0.75] }).raw().toBuffer();
    const expected = await input(21, 12).rotate(90)
      .extract({ left: 0, top: 7, width: 12, height: 12 }).raw().toBuffer();
    t.assert.deepStrictEqual(actual, expected);
  });

  for (const fit of ['cover', 'contain']) {
    test(`${fit} positions each frame separately`, async (t) => {
      const size = fit === 'cover' ? 12 : 21;
      const actual = await input(12, 42, 21)
        .resize(size, size, { fit, position: [0.25, 0.75] }).raw().toBuffer({ resolveWithObject: true });
      const source = await input(12, 42).raw().toBuffer();
      const frames = [];
      for (let page = 0; page < 2; page++) {
        const frame = sharp(source.subarray(page * 12 * 21 * 3, (page + 1) * 12 * 21 * 3), {
          raw: { width: 12, height: 21, channels: 3 }
        });
        frames.push(await (fit === 'cover'
          ? frame.extract({ left: 0, top: 7, width: 12, height: 12 })
          : frame.extend({ left: 2, right: 7, top: 0, bottom: 0 })).raw().toBuffer());
      }
      t.assert.deepStrictEqual(actual.data, Buffer.concat(frames));
      t.assert.strictEqual(actual.info.pageHeight, size);
      t.assert.strictEqual(actual.info.pages, 2);
    });
  }

  for (const position of ['east', sharp.strategy.entropy, sharp.strategy.attention]) {
    test(`a later position ${position} replaces coordinates`, async (t) => {
      const actual = await input(21, 12).resize(12, 12, { position: [0.25, 0.75] })
        .resize(12, 12, { position }).raw().toBuffer();
      const expected = await input(21, 12).resize(12, 12, { position }).raw().toBuffer();
      t.assert.deepStrictEqual(actual, expected);
    });
  }

  test('coordinates replace a previous strategy', async (t) => {
    const actual = await input(21, 12).resize(12, 12, { position: sharp.strategy.entropy })
      .resize(12, 12, { position: [0.25, 0.75] }).raw().toBuffer();
    const expected = await input(21, 12).extract({ left: 2, top: 0, width: 12, height: 12 }).raw().toBuffer();
    t.assert.deepStrictEqual(actual, expected);
  });

  test('coordinates are copied when supplied', async (t) => {
    const position = [0.25, 0.75];
    const pipeline = input(21, 12).resize(12, 12, { position });
    position[0] = 1;
    const actual = await pipeline.raw().toBuffer();
    const expected = await input(21, 12).extract({ left: 2, top: 0, width: 12, height: 12 }).raw().toBuffer();
    t.assert.deepStrictEqual(actual, expected);
  });

  test('clone position does not change the original pipeline', async (t) => {
    const pipeline = input(21, 12).resize(12, 12, { position: [0.25, 0.75] });
    const clone = pipeline.clone().resize(12, 12, { position: [1, 0.5] });
    t.assert.deepStrictEqual(await pipeline.raw().toBuffer(),
      await input(21, 12).extract({ left: 2, top: 0, width: 12, height: 12 }).raw().toBuffer());
    t.assert.deepStrictEqual(await clone.raw().toBuffer(),
      await input(21, 12).extract({ left: 9, top: 0, width: 12, height: 12 }).raw().toBuffer());
  });

  for (const position of [
    [], [0.5], [0.5, 0.5, 0.5], ['0.5', 0.5], [0.5, '0.5'],
    [NaN, 0.5], [0.5, NaN], [Infinity, 0.5], [0.5, -Infinity],
    [-0.1, 0.5], [1.1, 0.5], [0.5, -0.1], [0.5, 1.1],
    [null, 0.5], [0.5, undefined], Array(2)
  ]) {
    test(`rejects invalid coordinates ${String(position)}`, (t) => {
      t.assert.throws(() => sharp().resize(12, 12, { position }),
        /Expected an array of two numbers between 0 and 1 for position/);
    });
  }
});
