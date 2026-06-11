/*!
  Copyright 2013 Lovell Fuller and others.
  SPDX-License-Identifier: Apache-2.0
*/

import { suite, test } from 'node:test';

import sharp from '../../lib/index.js';
import fixtures from '../fixtures/index.js';

suite('Affine transform', () => {
  suite('Invalid input', () => {
    test('Missing matrix', (t) => {
      t.plan(1);
      t.assert.throws(() => {
        sharp(fixtures.inputJpg)
          .affine();
      });
    });
    test('Invalid 1d matrix', (t) => {
      t.plan(1);
      t.assert.throws(() => {
        sharp(fixtures.inputJpg)
          .affine(['123', 123, 123, 123]);
      });
    });
    test('Invalid 2d matrix', (t) => {
      t.plan(1);
      t.assert.throws(() => {
        sharp(fixtures.inputJpg)
          .affine([[123, 123], [null, 123]]);
      });
    });
    test('Invalid options parameter type', (t) => {
      t.plan(1);
      t.assert.throws(() => {
        sharp(fixtures.inputJpg)
          .affine([[1, 0], [0, 1]], 'invalid options type');
      });
    });
    test('Invalid background color', (t) => {
      t.plan(1);
      t.assert.throws(() => {
        sharp(fixtures.inputJpg)
          .affine([4, 4, 4, 4], { background: 'not a color' });
      });
    });
    test('Invalid idx offset type', (t) => {
      t.plan(1);
      t.assert.throws(() => {
        sharp(fixtures.inputJpg)
          .affine([[4, 4], [4, 4]], { idx: 'invalid idx type' });
      });
    });
    test('Invalid idy offset type', (t) => {
      t.plan(1);
      t.assert.throws(() => {
        sharp(fixtures.inputJpg)
          .affine([4, 4, 4, 4], { idy: 'invalid idy type' });
      });
    });
    test('Invalid odx offset type', (t) => {
      t.plan(1);
      t.assert.throws(() => {
        sharp(fixtures.inputJpg)
          .affine([[4, 4], [4, 4]], { odx: 'invalid odx type' });
      });
    });
    test('Invalid ody offset type', (t) => {
      t.plan(1);
      t.assert.throws(() => {
        sharp(fixtures.inputJpg)
          .affine([[4, 4], [4, 4]], { ody: 'invalid ody type' });
      });
    });
    test('Invalid interpolator', (t) => {
      t.plan(1);
      t.assert.throws(() => {
        sharp(fixtures.inputJpg)
          .affine([[4, 4], [4, 4]], { interpolator: 'cubic' });
      });
    });
  });
  test('Applies identity matrix', async (t) => {
    t.plan(1);
    const input = fixtures.inputJpg;
    const data = await sharp(input)
      .affine([[1, 0], [0, 1]])
      .toBuffer();
    await t.assert.doesNotReject(() => fixtures.assertSimilar(input, data));
  });
  test('Applies resize affine matrix', async (t) => {
    t.plan(3);
    const input = fixtures.inputJpg;
    const inputWidth = 2725;
    const inputHeight = 2225;
    const { data, info } = await sharp(input)
      .affine([[0.2, 0], [0, 1.5]])
      .toBuffer({ resolveWithObject: true });
    await t.assert.doesNotReject(() => fixtures.assertSimilar(input, data));
    t.assert.strictEqual(info.width, Math.ceil(inputWidth * 0.2));
    t.assert.strictEqual(info.height, Math.ceil(inputHeight * 1.5));
  });
  test('Resizes and applies affine transform', async (t) => {
    t.plan(1);
    const input = fixtures.inputJpg;
    const data = await sharp(input)
      .resize(500, 500)
      .affine([[0.5, 1], [1, 0.5]])
      .toBuffer();
    await t.assert.doesNotReject(() => fixtures.assertSimilar(data, fixtures.expected('affine-resize-expected.jpg')));
  });
  test('Extracts and applies affine transform', async (t) => {
    t.plan(1);
    const data = await sharp(fixtures.inputJpg)
      .extract({ left: 300, top: 300, width: 600, height: 600 })
      .affine([0.3, 0, -0.5, 0.3])
      .toBuffer();
    await t.assert.doesNotReject(() => fixtures.assertSimilar(data, fixtures.expected('affine-extract-expected.jpg')));
  });
  test('Rotates and applies affine transform', async (t) => {
    t.plan(1);
    const data = await sharp(fixtures.inputJpg320x240)
      .rotate(90)
      .affine([[-1.2, 0], [0, -1.2]])
      .toBuffer();
    await t.assert.doesNotReject(() => fixtures.assertSimilar(data, fixtures.expected('affine-rotate-expected.jpg')));
  });
  test('Extracts, rotates and applies affine transform', async (t) => {
    t.plan(1);
    const data = await sharp(fixtures.inputJpg)
      .extract({ left: 1000, top: 1000, width: 200, height: 200 })
      .rotate(45, { background: 'blue' })
      .affine([[2, 1], [2, -0.5]], { background: 'red' })
      .toBuffer();
    await t.assert.doesNotReject(() => fixtures.assertSimilar(data, fixtures.expected('affine-extract-rotate-expected.jpg')));
  });
  test('Applies affine transform with background color', async (t) => {
    t.plan(1);
    const data = await sharp(fixtures.inputJpg320x240)
      .rotate(180)
      .affine([[-1.5, 1.2], [-1, 1]], { background: 'red' })
      .toBuffer();
    await t.assert.doesNotReject(() => fixtures.assertSimilar(data, fixtures.expected('affine-background-expected.jpg')));
  });
  test('Applies affine transform with background color and output offsets', async (t) => {
    t.plan(1);
    const data = await sharp(fixtures.inputJpg320x240)
      .rotate(180)
      .affine([[-2, 1.5], [-1, 2]], { background: 'blue', odx: 40, ody: -100 })
      .toBuffer();
    await t.assert.doesNotReject(() => fixtures.assertSimilar(data, fixtures.expected('affine-background-output-offsets-expected.jpg')));
  });
  test('Applies affine transform with background color and all offsets', async (t) => {
    t.plan(1);
    const data = await sharp(fixtures.inputJpg320x240)
      .rotate(180)
      .affine([[-1.2, 1.8], [-1, 2]], { background: 'yellow', idx: 10, idy: -40, odx: 10, ody: -50 })
      .toBuffer();
    await t.assert.doesNotReject(() => fixtures.assertSimilar(data, fixtures.expected('affine-background-all-offsets-expected.jpg')));
  });

  test('Animated image rejects', async (t) => {
    t.plan(1);
    await t.assert.rejects(() => sharp(fixtures.inputGifAnimated, { animated: true })
      .affine([1, 1, 1, 1])
      .toBuffer(),
    /Affine is not supported for multi-page images/
    )
  });

  suite('Interpolations', () => {
    const input = fixtures.inputJpg320x240;
    const inputWidth = 320;
    const inputHeight = 240;
    for (const interp in sharp.interpolators) {
      test(`Performs 2x upscale with ${interp} interpolation`, async (t) => {
        t.plan(3);
        const { data, info } = await sharp(input)
          .affine([[2, 0], [0, 2]], { interpolator: sharp.interpolators[interp] })
          .toBuffer({ resolveWithObject: true });
        t.assert.strictEqual(info.width, Math.ceil(inputWidth * 2));
        t.assert.strictEqual(info.height, Math.ceil(inputHeight * 2));
        await t.assert.doesNotReject(() => fixtures.assertSimilar(fixtures.expected(`affine-${sharp.interpolators[interp]}-2x-upscale-expected.jpg`), data));
      });
    }
  });
});
