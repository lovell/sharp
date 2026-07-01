/*!
  Copyright 2013 Lovell Fuller and others.
  SPDX-License-Identifier: Apache-2.0
*/

import { suite, test } from 'node:test';

import sharp from '../../lib/index.js';
import fixtures from '../fixtures/index.js';

suite('Threshold', () => {
  test('threshold 1 jpeg', async (t) => {
    t.plan(4);
    const { data, info } = await sharp(fixtures.inputJpg)
      .resize(320, 240)
      .threshold(1)
      .toBuffer({ resolveWithObject: true });
    t.assert.strictEqual(info.format, 'jpeg');
    t.assert.strictEqual(info.width, 320);
    t.assert.strictEqual(info.height, 240);
    await t.assert.doesNotReject(() => fixtures.assertSimilar(fixtures.expected('threshold-1.jpg'), data));
  });

  test('threshold 40 jpeg', async (t) => {
    t.plan(4);
    const { data, info } = await sharp(fixtures.inputJpg)
      .resize(320, 240)
      .threshold(40)
      .toBuffer({ resolveWithObject: true });
    t.assert.strictEqual(info.format, 'jpeg');
    t.assert.strictEqual(info.width, 320);
    t.assert.strictEqual(info.height, 240);
    await t.assert.doesNotReject(() => fixtures.assertSimilar(fixtures.expected('threshold-40.jpg'), data));
  });

  test('threshold 128', async (t) => {
    t.plan(4);
    const { data, info } = await sharp(fixtures.inputJpg)
      .resize(320, 240)
      .threshold(128)
      .toBuffer({ resolveWithObject: true });
    t.assert.strictEqual(info.format, 'jpeg');
    t.assert.strictEqual(info.width, 320);
    t.assert.strictEqual(info.height, 240);
    await t.assert.doesNotReject(() => fixtures.assertSimilar(fixtures.expected('threshold-128.jpg'), data));
  });

  test('threshold true (=128)', async (t) => {
    t.plan(4);
    const { data, info } = await sharp(fixtures.inputJpg)
      .resize(320, 240)
      .threshold(true)
      .toBuffer({ resolveWithObject: true });
    t.assert.strictEqual(info.format, 'jpeg');
    t.assert.strictEqual(info.width, 320);
    t.assert.strictEqual(info.height, 240);
    await t.assert.doesNotReject(() => fixtures.assertSimilar(fixtures.expected('threshold-128.jpg'), data));
  });

  test('threshold false (=0)', async (t) => {
    t.plan(1);
    const data = await sharp(fixtures.inputJpg)
      .threshold(false)
      .toBuffer();
    await t.assert.doesNotReject(() => fixtures.assertSimilar(fixtures.inputJpg, data));
  });

  test('threshold grayscale: true (=128)', async (t) => {
    t.plan(4);
    const { data, info } = await sharp(fixtures.inputJpg)
      .resize(320, 240)
      .threshold(128, { grayscale: true })
      .toBuffer({ resolveWithObject: true });
    t.assert.strictEqual(info.format, 'jpeg');
    t.assert.strictEqual(info.width, 320);
    t.assert.strictEqual(info.height, 240);
    await t.assert.doesNotReject(() => fixtures.assertSimilar(fixtures.expected('threshold-128.jpg'), data));
  });

  test('threshold default jpeg', async (t) => {
    t.plan(4);
    const { data, info } = await sharp(fixtures.inputJpg)
      .resize(320, 240)
      .threshold()
      .toBuffer({ resolveWithObject: true });
    t.assert.strictEqual(info.format, 'jpeg');
    t.assert.strictEqual(info.width, 320);
    t.assert.strictEqual(info.height, 240);
    await t.assert.doesNotReject(() => fixtures.assertSimilar(fixtures.expected('threshold-128.jpg'), data));
  });

  test('threshold default png transparency', async (t) => {
    t.plan(4);
    const { data, info } = await sharp(fixtures.inputPngWithTransparency)
      .resize(320, 240)
      .threshold()
      .toBuffer({ resolveWithObject: true });
    t.assert.strictEqual(info.format, 'png');
    t.assert.strictEqual(info.width, 320);
    t.assert.strictEqual(info.height, 240);
    await t.assert.doesNotReject(() => fixtures.assertSimilar(fixtures.expected('threshold-128-transparency.png'), data));
  });

  test('threshold default png alpha', async (t) => {
    t.plan(4);
    const { data, info } = await sharp(fixtures.inputPngWithGreyAlpha)
      .resize(320, 240)
      .threshold()
      .toBuffer({ resolveWithObject: true });
    t.assert.strictEqual(info.format, 'png');
    t.assert.strictEqual(info.width, 320);
    t.assert.strictEqual(info.height, 240);
    await t.assert.doesNotReject(() => fixtures.assertSimilar(fixtures.expected('threshold-128-alpha.png'), data));
  });

  test('threshold default webp transparency', async (t) => {
    t.plan(2);
    const { data, info } = await sharp(fixtures.inputWebPWithTransparency)
      .threshold()
      .toBuffer({ resolveWithObject: true });
    t.assert.strictEqual(info.format, 'webp');
    await t.assert.doesNotReject(() => fixtures.assertSimilar(fixtures.expected('threshold-128-transparency.webp'), data));
  });

  test('color threshold', async (t) => {
    t.plan(4);
    const { data, info } = await sharp(fixtures.inputJpg)
      .resize(320, 240)
      .threshold(128, { grayscale: false })
      .toBuffer({ resolveWithObject: true });
    t.assert.strictEqual(info.format, 'jpeg');
    t.assert.strictEqual(info.width, 320);
    t.assert.strictEqual(info.height, 240);
    await t.assert.doesNotReject(() => fixtures.assertSimilar(fixtures.expected('threshold-color-128.jpg'), data));
  });

  test('invalid threshold -1', (t) => {
    t.plan(1);
    t.assert.throws(() => {
      sharp().threshold(-1);
    });
  });

  test('invalid threshold 256', (t) => {
    t.plan(1);
    t.assert.throws(() => {
      sharp().threshold(256);
    });
  });
});
