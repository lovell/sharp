/*!
  Copyright 2013 Lovell Fuller and others.
  SPDX-License-Identifier: Apache-2.0
*/

import { suite, test } from 'node:test';

import sharp from '../../lib/index.js';
import fixtures from '../fixtures/index.js';

suite('Convolve', () => {
  test('specific convolution kernel 1', async (t) => {
    t.plan(4);
    const { data, info } = await sharp(fixtures.inputPngStripesV)
      .convolve({
        width: 3,
        height: 3,
        scale: 50,
        offset: 0,
        kernel: [
          10, 20, 10,
          0, 0, 0,
          10, 20, 10
        ]
      })
      .toBuffer({ resolveWithObject: true });
    t.assert.strictEqual('png', info.format);
    t.assert.strictEqual(320, info.width);
    t.assert.strictEqual(240, info.height);
    await t.assert.doesNotReject(() => fixtures.assertSimilar(fixtures.expected('conv-1.png'), data));
  });

  test('specific convolution kernel 2', async (t) => {
    t.plan(4);
    const { data, info } = await sharp(fixtures.inputPngStripesH)
      .convolve({
        width: 3,
        height: 3,
        kernel: [
          1, 0, 1,
          2, 0, 2,
          1, 0, 1
        ]
      })
      .toBuffer({ resolveWithObject: true });
    t.assert.strictEqual('png', info.format);
    t.assert.strictEqual(320, info.width);
    t.assert.strictEqual(240, info.height);
    await t.assert.doesNotReject(() => fixtures.assertSimilar(fixtures.expected('conv-2.png'), data));
  });

  test('horizontal Sobel operator', async (t) => {
    t.plan(4);
    const { data, info } = await sharp(fixtures.inputJpg)
      .resize(320, 240)
      .convolve({
        width: 3,
        height: 3,
        kernel: [
          -1, 0, 1,
          -2, 0, 2,
          -1, 0, 1
        ]
      })
      .toBuffer({ resolveWithObject: true });
    t.assert.strictEqual('jpeg', info.format);
    t.assert.strictEqual(320, info.width);
    t.assert.strictEqual(240, info.height);
    await t.assert.doesNotReject(() => fixtures.assertSimilar(fixtures.expected('conv-sobel-horizontal.jpg'), data));
  });

  suite('invalid kernel specification', () => {
    test('missing', (t) => {
      t.plan(1);
      t.assert.throws(() => {
        sharp(fixtures.inputJpg).convolve({});
      });
    });
    test('incorrect data format', (t) => {
      t.plan(1);
      t.assert.throws(() => {
        sharp(fixtures.inputJpg).convolve({
          width: 3,
          height: 3,
          kernel: [[1, 2, 3], [4, 5, 6], [7, 8, 9]]
        });
      });
    });
    test('incorrect dimensions', (t) => {
      t.plan(1);
      t.assert.throws(() => {
        sharp(fixtures.inputJpg).convolve({
          width: 3,
          height: 4,
          kernel: [1, 2, 3, 4, 5, 6, 7, 8, 9]
        });
      });
    });
  });
});
